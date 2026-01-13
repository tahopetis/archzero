use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::tco::*;
use crate::error::AppError;

pub struct TCOService;

impl TCOService {
    pub fn new() -> Self {
        Self
    }

    /// Calculate TCO for a single card
    pub fn calculate_tco(
        &self,
        card_id: Uuid,
        card_name: String,
        request: TCOCalculationRequest,
        dependencies: Vec<DependencyInfo>,
        consumers: Vec<ConsumerInfo>,
    ) -> Result<TCOCalculation> {
        // Calculate base cost from components
        let annual_base_cost = self.sum_cost_components(&request.cost_breakdown);
        let monthly_base_cost = annual_base_cost / 12.0;

        let base_cost = CostBreakdown {
            annual_amount: annual_base_cost,
            monthly_amount: monthly_base_cost,
            components: request.cost_breakdown,
        };

        // Calculate allocated costs (costs this card allocates to consumers)
        let allocated_costs = if request.allocation_strategy.method != AllocationMethod::None {
            self.allocate_to_consumers(
                card_id,
                &card_name,
                annual_base_cost,
                &consumers,
                &request.allocation_strategy,
            )?
        } else {
            Vec::new()
        };

        // Calculate dependency costs (portion of dependency TCOs allocated to this card)
        let dependency_costs = if request.allocation_strategy.include_dependencies {
            self.allocate_from_dependencies(
                card_id,
                &dependencies,
                &request.allocation_strategy,
            )?
        } else {
            Vec::new()
        };

        // Calculate total TCO
        let total_allocated_to_others: f64 = allocated_costs.iter().map(|c| c.amount).sum();
        let total_from_dependencies: f64 = dependency_costs.iter().map(|c| c.allocated_amount).sum();

        let total_annual_tco = annual_base_cost + total_from_dependencies - total_allocated_to_others;
        let total_monthly_tco = total_annual_tco / 12.0;

        Ok(TCOCalculation {
            id: Uuid::new_v4(),
            card_id,
            card_name,
            base_cost,
            allocated_costs,
            dependency_costs,
            total_tco: total_annual_tco,
            total_tco_monthly: total_monthly_tco,
            currency: request.currency,
            calculated_at: chrono::Utc::now(),
            calculation_period_months: request.calculation_period_months,
        })
    }

    /// Sum all cost components
    fn sum_cost_components(&self, components: &CostComponents) -> f64 {
        [
            components.infrastructure,
            components.software_licenses,
            components.support_contracts,
            components.personnel,
            components.development_amortized,
            components.implementation_amortized,
            components.migration_amortized,
            components.downtime_risk,
            components.security_incidents,
            components.compliance_fines,
            components.training,
            components.other,
        ].iter().sum()
    }

    /// Allocate costs from this card to consumers
    fn allocate_to_consumers(
        &self,
        card_id: Uuid,
        card_name: &str,
        total_cost: f64,
        consumers: &[ConsumerInfo],
        strategy: &AllocationStrategy,
    ) -> Result<Vec<AllocatedCost>> {
        if consumers.is_empty() {
            return Ok(Vec::new());
        }

        match strategy.method {
            AllocationMethod::EvenSplit => {
                let amount_per_consumer = total_cost / consumers.len() as f64;
                let percentage = (100.0 / consumers.len() as f64).min(100.0);

                Ok(consumers.iter().map(|consumer| {
                    AllocatedCost {
                        id: Uuid::new_v4(),
                        source_card_id: card_id,
                        source_card_name: card_name.to_string(),
                        amount: amount_per_consumer,
                        percentage,
                        allocation_method: AllocationMethod::EvenSplit,
                        description: format!("Even split of {} costs", card_name),
                    }
                }).collect())
            }

            AllocationMethod::ManualPercentage => {
                let manual_allocations = strategy.manual_allocations.as_ref()
                    .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Manual allocations required but not provided")))?;

                // Verify total percentage = 100%
                let total_percentage: f64 = manual_allocations.iter().map(|a| a.percentage).sum();
                if (total_percentage - 100.0).abs() > 0.01 {
                    return Err(AppError::Internal(anyhow::anyhow!(
                        "Manual allocations must sum to 100%, got {}", total_percentage
                    )).into());
                }

                Ok(manual_allocations.iter().map(|alloc| {
                    let consumer_name = consumers.iter()
                        .find(|c| c.card_id == alloc.source_card_id)
                        .map(|c| c.card_name.clone())
                        .unwrap_or_else(|| "Unknown".to_string());

                    AllocatedCost {
                        id: Uuid::new_v4(),
                        source_card_id: card_id,
                        source_card_name: card_name.to_string(),
                        amount: (alloc.percentage / 100.0) * total_cost,
                        percentage: alloc.percentage,
                        allocation_method: AllocationMethod::ManualPercentage,
                        description: format!("Manual allocation of {} costs to {}", card_name, consumer_name),
                    }
                }).collect())
            }

            AllocationMethod::UsageBased => {
                // Allocate based on usage metrics (e.g., transaction count)
                let usage_metrics = strategy.usage_metrics.as_ref()
                    .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Usage metrics required for usage-based allocation")))?;

                self.allocate_by_usage(card_id, card_name, total_cost, consumers, usage_metrics)
            }

            AllocationMethod::CriticalityBased => {
                // Allocate based on consumer criticality levels
                self.allocate_by_criticality(card_id, card_name, total_cost, consumers)
            }

            AllocationMethod::TransactionBased => {
                // Similar to usage-based but specifically transaction count
                let usage_metrics = strategy.usage_metrics.as_ref()
                    .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Usage metrics required for transaction-based allocation")))?;

                self.allocate_by_transactions(card_id, card_name, total_cost, consumers, usage_metrics)
            }

            AllocationMethod::None => Ok(Vec::new()),
        }
    }

    /// Allocate based on usage metrics
    fn allocate_by_usage(
        &self,
        card_id: Uuid,
        card_name: &str,
        total_cost: f64,
        consumers: &[ConsumerInfo],
        metrics: &UsageMetrics,
    ) -> Result<Vec<AllocatedCost>> {
        // Calculate total usage across all consumers
        let total_usage: f64 = consumers.iter()
            .map(|c| {
                c.usage_metrics.as_ref()
                    .and_then(|m| m.custom_metrics.as_ref())
                    .and_then(|custom| custom.get("usage_count").copied())
                    .unwrap_or(1.0)
            })
            .sum();

        if total_usage == 0.0 {
            return Ok(Vec::new());
        }

        Ok(consumers.iter().map(|consumer| {
            let consumer_usage = consumer.usage_metrics.as_ref()
                .and_then(|m| m.custom_metrics.as_ref())
                .and_then(|custom| custom.get("usage_count").copied())
                .unwrap_or(0.0);

            let percentage = if total_usage > 0.0 {
                (consumer_usage / total_usage) * 100.0
            } else {
                0.0
            };

            AllocatedCost {
                id: Uuid::new_v4(),
                source_card_id: card_id,
                source_card_name: card_name.to_string(),
                amount: (percentage / 100.0) * total_cost,
                percentage,
                allocation_method: AllocationMethod::UsageBased,
                description: format!("Usage-based allocation of {} costs", card_name),
            }
        }).collect())
    }

    /// Allocate based on consumer criticality
    fn allocate_by_criticality(
        &self,
        card_id: Uuid,
        card_name: &str,
        total_cost: f64,
        consumers: &[ConsumerInfo],
    ) -> Result<Vec<AllocatedCost>> {
        // Weight criticality: Critical=5, High=4, Medium=3, Low=2, Minimal=1
        let total_weight: f64 = consumers.iter()
            .map(|c| self.criticality_weight(&c.criticality))
            .sum();

        if total_weight == 0.0 {
            return Ok(Vec::new());
        }

        Ok(consumers.iter().map(|consumer| {
            let weight = self.criticality_weight(&consumer.criticality);
            let percentage = (weight / total_weight) * 100.0;

            AllocatedCost {
                id: Uuid::new_v4(),
                source_card_id: card_id,
                source_card_name: card_name.to_string(),
                amount: (percentage / 100.0) * total_cost,
                percentage,
                allocation_method: AllocationMethod::CriticalityBased,
                description: format!("Criticality-based allocation of {} costs", card_name),
            }
        }).collect())
    }

    /// Allocate based on transaction volume
    fn allocate_by_transactions(
        &self,
        card_id: Uuid,
        card_name: &str,
        total_cost: f64,
        consumers: &[ConsumerInfo],
        metrics: &UsageMetrics,
    ) -> Result<Vec<AllocatedCost>> {
        // Use transaction count if available, otherwise user count
        let total_transactions: f64 = consumers.iter()
            .map(|c| {
                c.usage_metrics.as_ref()
                    .and_then(|m| m.transaction_count)
                    .unwrap_or(0) as f64
            })
            .sum();

        if total_transactions == 0.0 {
            return Ok(Vec::new());
        }

        Ok(consumers.iter().map(|consumer| {
            let transactions = consumer.usage_metrics.as_ref()
                .and_then(|m| m.transaction_count)
                .unwrap_or(0) as f64;

            let percentage = (transactions / total_transactions) * 100.0;

            AllocatedCost {
                id: Uuid::new_v4(),
                source_card_id: card_id,
                source_card_name: card_name.to_string(),
                amount: (percentage / 100.0) * total_cost,
                percentage,
                allocation_method: AllocationMethod::TransactionBased,
                description: format!("Transaction-based allocation of {} costs", card_name),
            }
        }).collect())
    }

    /// Calculate weight for criticality level
    fn criticality_weight(&self, criticality: &str) -> f64 {
        match criticality.to_lowercase().as_str() {
            "critical" => 5.0,
            "high" => 4.0,
            "medium" => 3.0,
            "low" => 2.0,
            "minimal" => 1.0,
            _ => 1.0,
        }
    }

    /// Allocate costs from dependencies to this card
    fn allocate_from_dependencies(
        &self,
        card_id: Uuid,
        dependencies: &[DependencyInfo],
        strategy: &AllocationStrategy,
    ) -> Result<Vec<DependencyCost>> {
        if dependencies.is_empty() {
            return Ok(Vec::new());
        }

        // For each dependency, calculate what portion of its cost should be allocated to this card
        // Simplified: assume even split among all consumers of the dependency
        dependencies.iter().map(|dep| {
            let allocated_amount = if dep.consumer_count > 0 {
                dep.total_tco / dep.consumer_count as f64
            } else {
                0.0
            };

            Ok(DependencyCost {
                id: Uuid::new_v4(),
                dependency_card_id: dep.card_id,
                dependency_card_name: dep.card_name.clone(),
                allocated_amount,
                relationship_type: dep.relationship_type.clone(),
                description: format!("Allocated cost from dependency {}", dep.card_name),
            })
        }).collect()
    }

    /// Calculate portfolio-level TCO summary
    pub fn calculate_portfolio_tco(&self, calculations: Vec<TCOCalculation>) -> Result<TCOPortfolio> {
        if calculations.is_empty() {
            return Err(AppError::Internal(anyhow::anyhow!("No TCO calculations provided")).into());
        }

        let total_applications = calculations.len() as u32;
        let total_annual_tco: f64 = calculations.iter().map(|c| c.total_tco).sum();
        let average_tco_per_app = total_annual_tco / total_applications as f64;

        // Aggregate cost components
        let cost_by_category = {
            let mut sums = CostComponents {
                infrastructure: 0.0,
                software_licenses: 0.0,
                support_contracts: 0.0,
                personnel: 0.0,
                development_amortized: 0.0,
                implementation_amortized: 0.0,
                migration_amortized: 0.0,
                downtime_risk: 0.0,
                security_incidents: 0.0,
                compliance_fines: 0.0,
                training: 0.0,
                other: 0.0,
            };

            for calc in &calculations {
                sums.infrastructure += calc.base_cost.components.infrastructure;
                sums.software_licenses += calc.base_cost.components.software_licenses;
                sums.support_contracts += calc.base_cost.components.support_contracts;
                sums.personnel += calc.base_cost.components.personnel;
                sums.development_amortized += calc.base_cost.components.development_amortized;
                sums.implementation_amortized += calc.base_cost.components.implementation_amortized;
                sums.migration_amortized += calc.base_cost.components.migration_amortized;
                sums.downtime_risk += calc.base_cost.components.downtime_risk;
                sums.security_incidents += calc.base_cost.components.security_incidents;
                sums.compliance_fines += calc.base_cost.components.compliance_fines;
                sums.training += calc.base_cost.components.training;
                sums.other += calc.base_cost.components.other;
            }

            sums
        };

        // Sort by cost and get top 10
        let mut sorted_calcs = calculations.clone();
        sorted_calcs.sort_by(|a, b| b.total_tco.partial_cmp(&a.total_tco).unwrap());

        let top_10_costliest = sorted_calcs.iter()
            .take(10)
            .map(|calc| TCOItem {
                card_id: calc.card_id,
                card_name: calc.card_name.clone(),
                annual_tco: calc.total_tco,
                percentage_of_total: (calc.total_tco / total_annual_tco) * 100.0,
            })
            .collect();

        let currency = calculations.first()
            .map(|c| c.currency.clone())
            .unwrap_or_else(|| "USD".to_string());

        // Simplified trend data (would need historical data in production)
        let cost_trend_months = vec![
            CostTrendDataPoint {
                month: 1,
                total_tco: total_annual_tco / 12.0,
                breakdown: cost_by_category.clone(),
            }
        ];

        Ok(TCOPortfolio {
            total_applications,
            total_annual_tco,
            average_tco_per_app,
            cost_by_category,
            top_10_costliest,
            cost_trend_months,
            currency,
        })
    }
}

/// Information about a dependency (platform this card depends on)
#[derive(Debug, Clone)]
pub struct DependencyInfo {
    pub card_id: Uuid,
    pub card_name: String,
    pub total_tco: f64,
    pub consumer_count: u32,  // Number of applications that depend on this
    pub relationship_type: String,
}

/// Information about a consumer (application that depends on this card)
#[derive(Debug, Clone)]
pub struct ConsumerInfo {
    pub card_id: Uuid,
    pub card_name: String,
    pub criticality: String,  // Critical, High, Medium, Low, Minimal
    pub usage_metrics: Option<UsageMetrics>,
}
