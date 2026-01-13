use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;

use crate::models::migration::*;
use crate::error::AppError;

pub struct MigrationService {
    profiles: HashMap<String, MigrationProfile>,
}

impl MigrationService {
    pub fn new() -> Self {
        let mut service = Self {
            profiles: HashMap::new(),
        };

        // Load default migration profile
        let default_profile = Self::default_migration_profile();
        service.profiles.insert("default".to_string(), default_profile);

        service
    }

    /// Generate migration recommendation for a card
    pub fn assess_migration(
        &self,
        card_id: Uuid,
        card_name: String,
        request: MigrationAssessmentRequest,
    ) -> Result<MigrationRecommendation> {
        let profile = self.profiles.get("default")
            .ok_or_else(|| AppError::NotFound("Default migration profile not found".to_string()))?;

        // Evaluate rules in priority order
        let mut best_match: Option<&MigrationRule> = None;

        for rule in &profile.rules {
            if self.evaluate_rule(&rule, &request.factors, &request.target_environment) {
                match &best_match {
                    None => best_match = Some(rule),
                    Some(current) => {
                        if rule.priority > current.priority {
                            best_match = Some(rule);
                        }
                    }
                }
            }
        }

        // Use matched rule or default recommendation
        let (recommendation, reasoning) = if let Some(rule) = best_match {
            let reasoning = self.format_reasoning(&rule.reasoning_template, &request.factors);
            (rule.recommendation.clone(), reasoning)
        } else {
            let reasoning = format!(
                "Using default recommendation for {} in {:?} environment",
                card_name, request.target_environment
            );
            (profile.default_recommendation.clone(), reasoning)
        };

        let effort_estimate = recommendation.effort_level();

        // Calculate cost impact based on factors
        let cost_impact = self.estimate_cost_impact(&request.factors, &recommendation, &request.target_environment);

        // Assess risk
        let risk_assessment = self.assess_risk(&request.factors, &recommendation);

        // Calculate confidence based on factor completeness
        let confidence_score = self.calculate_confidence(&request.factors);

        // Generate alternatives
        let alternative_options = self.generate_alternatives(&recommendation, &request.factors);

        Ok(MigrationRecommendation {
            id: Uuid::new_v4(),
            card_id,
            card_name,
            recommendation,
            reasoning,
            effort_estimate,
            cost_impact,
            risk_assessment,
            confidence_score,
            alternative_options,
            assessed_at: Utc::now(),
            assessment_version: "1.0".to_string(),
        })
    }

    /// Evaluate a migration rule against factors
    fn evaluate_rule(
        &self,
        rule: &MigrationRule,
        factors: &MigrationFactors,
        _target_env: &TargetEnvironment,
    ) -> bool {
        // Parse and evaluate condition (simplified logic)
        // In production, this would use a proper rules engine or JSONLogic

        let condition = rule.condition.to_lowercase();

        // Rule evaluation logic
        if condition.contains("retire") && condition.contains("end_of_life") {
            factors.technology_age_years.unwrap_or(0) > 15
                || matches!(factors.maintenance_burden, MaintenanceLevel::VeryHigh)
        } else if condition.contains("retire") && condition.contains("strategic") {
            matches!(factors.strategic_fit, StrategicFit::Declining | StrategicFit::Misaligned)
        } else if condition.contains("replace") && condition.contains("commodity") {
            matches!(factors.customization_level, CustomizationLevel::None)
                && !matches!(factors.business_criticality, CriticalityLevel::Critical)
        } else if condition.contains("retain") && condition.contains("stable") {
            matches!(factors.maintenance_burden, MaintenanceLevel::Low)
                && matches!(factors.business_criticality, CriticalityLevel::Medium)
                && !factors.performance_issues
        } else if condition.contains("replatform") && condition.contains("custom") {
            matches!(factors.customization_level, CustomizationLevel::VeryHigh)
                && matches!(factors.business_criticality, CriticalityLevel::High | CriticalityLevel::Critical)
        } else if condition.contains("rehost") && condition.contains("legacy") {
            factors.technology_age_years.unwrap_or(0) > 10
                && matches!(factors.customization_level, CustomizationLevel::Medium | CustomizationLevel::High | CustomizationLevel::VeryHigh)
        } else if condition.contains("refactor") {
            matches!(factors.customization_level, CustomizationLevel::None | CustomizationLevel::Low | CustomizationLevel::Medium)
                && matches!(factors.integration_complexity, ComplexityLevel::Low | ComplexityLevel::Medium)
        } else {
            false
        }
    }

    /// Format reasoning template with factor values
    fn format_reasoning(&self, template: &str, factors: &MigrationFactors) -> String {
        template
            .replace("{criticality}", &format!("{:?}", factors.business_criticality))
            .replace("{customization}", &format!("{:?}", factors.customization_level))
            .replace("{maintenance}", &format!("{:?}", factors.maintenance_burden))
            .replace("{strategic_fit}", &format!("{:?}", factors.strategic_fit))
            .replace("{age}", &factors.technology_age_years.unwrap_or(0).to_string())
    }

    /// Estimate cost impact of migration
    fn estimate_cost_impact(
        &self,
        factors: &MigrationFactors,
        recommendation: &RecommendationType,
        target_env: &TargetEnvironment,
    ) -> CostImpact {
        // Simplified cost estimation logic
        match recommendation {
            RecommendationType::Retire => CostImpact::SignificantSavings,
            RecommendationType::Replace => {
                if matches!(factors.maintenance_burden, MaintenanceLevel::High | MaintenanceLevel::VeryHigh) {
                    CostImpact::ModerateSavings
                } else {
                    CostImpact::Neutral
                }
            }
            RecommendationType::Retain => CostImpact::Neutral,
            RecommendationType::Rehost => {
                if matches!(target_env, TargetEnvironment::Aws | TargetEnvironment::Azure | TargetEnvironment::Gcp) {
                    CostImpact::ModerateIncrease
                } else {
                    CostImpact::Neutral
                }
            }
            RecommendationType::Refactor | RecommendationType::Revise => CostImpact::ModerateIncrease,
            RecommendationType::Replatform => CostImpact::SignificantIncrease,
        }
    }

    /// Assess risk level of migration
    fn assess_risk(&self, factors: &MigrationFactors, recommendation: &RecommendationType) -> RiskLevel {
        let base_risk = match factors.business_criticality {
            CriticalityLevel::Critical => RiskLevel::VeryHigh,
            CriticalityLevel::High => RiskLevel::High,
            CriticalityLevel::Medium => RiskLevel::Medium,
            CriticalityLevel::Low => RiskLevel::Low,
            CriticalityLevel::Minimal => RiskLevel::VeryLow,
        };

        let migration_risk = match recommendation {
            RecommendationType::Retain | RecommendationType::Retire => RiskLevel::VeryLow,
            RecommendationType::Replace => RiskLevel::Medium,
            RecommendationType::Rehost => RiskLevel::Low,
            RecommendationType::Refactor => RiskLevel::Medium,
            RecommendationType::Revise => RiskLevel::High,
            RecommendationType::Replatform => RiskLevel::VeryHigh,
        };

        // Combine risks
        match (base_risk, migration_risk) {
            (RiskLevel::VeryHigh, _) | (_, RiskLevel::VeryHigh) => RiskLevel::VeryHigh,
            (RiskLevel::High, RiskLevel::High) => RiskLevel::VeryHigh,
            (RiskLevel::High, _) | (_, RiskLevel::High) => RiskLevel::High,
            (RiskLevel::Medium, RiskLevel::Medium) => RiskLevel::High,
            (RiskLevel::Medium, _) | (_, RiskLevel::Medium) => RiskLevel::Medium,
            _ => RiskLevel::Low,
        }
    }

    /// Calculate confidence score based on factor completeness
    fn calculate_confidence(&self, factors: &MigrationFactors) -> f64 {
        let mut score = 0.0_f64;
        let mut total = 0.0_f64;

        if factors.technology_age_years.is_some() { score += 1.0; }
        total += 1.0;

        if !matches!(factors.business_criticality, CriticalityLevel::Medium) { score += 1.0; }
        total += 1.0;

        if !matches!(factors.strategic_fit, StrategicFit::Neutral) { score += 1.0; }
        total += 1.0;

        if factors.user_satisfaction > 0.0 { score += 1.0; }
        total += 1.0;

        if !matches!(factors.maintenance_burden, MaintenanceLevel::Medium) { score += 1.0; }
        total += 1.0;

        if total > 0.0 { score / total } else { 0.5 }
    }

    /// Generate alternative migration options
    fn generate_alternatives(&self, primary: &RecommendationType, _factors: &MigrationFactors) -> Vec<RecommendationType> {
        match primary {
            RecommendationType::Rehost => vec![RecommendationType::Refactor, RecommendationType::Retain],
            RecommendationType::Refactor => vec![RecommendationType::Rehost, RecommendationType::Revise],
            RecommendationType::Revise => vec![RecommendationType::Replatform, RecommendationType::Refactor],
            RecommendationType::Replatform => vec![RecommendationType::Revise, RecommendationType::Replace],
            RecommendationType::Replace => vec![RecommendationType::Replatform, RecommendationType::Retain],
            RecommendationType::Retire => vec![RecommendationType::Replace, RecommendationType::Retain],
            RecommendationType::Retain => vec![RecommendationType::Rehost, RecommendationType::Refactor],
        }
    }

    /// Default migration profile with decision rules
    fn default_migration_profile() -> MigrationProfile {
        MigrationProfile {
            name: "Default 6R Profile".to_string(),
            industry: "General".to_string(),
            default_recommendation: RecommendationType::Retain,
            rules: vec![
                // Rule 1: Retire old, non-strategic apps
                MigrationRule {
                    priority: 100,
                    name: "Retire end-of-life applications".to_string(),
                    condition: "technology_age_years > 15 OR (maintenance_burden == VeryHigh AND strategic_fit != Core)".to_string(),
                    recommendation: RecommendationType::Retire,
                    reasoning_template: "Application is {age} years old with {maintenance} maintenance burden and {strategic_fit} strategic fit. Recommend retirement.".to_string(),
                    effort_boost: Some(EffortLevel::Low),
                    cost_impact: Some(CostImpact::SignificantSavings),
                    risk_level: Some(RiskLevel::VeryLow),
                },
                // Rule 2: Retire declining strategic apps
                MigrationRule {
                    priority: 95,
                    name: "Retire non-strategic applications".to_string(),
                    condition: "strategic_fit == Declining OR strategic_fit == Misaligned".to_string(),
                    recommendation: RecommendationType::Retire,
                    reasoning_template: "Application has {strategic_fit} strategic fit. Recommend retirement and replacement with strategic alternative.".to_string(),
                    effort_boost: Some(EffortLevel::Low),
                    cost_impact: Some(CostImpact::ModerateSavings),
                    risk_level: Some(RiskLevel::Low),
                },
                // Rule 3: Replace commodity applications
                MigrationRule {
                    priority: 90,
                    name: "Replace with SaaS".to_string(),
                    condition: "customization == None AND criticality != Critical".to_string(),
                    recommendation: RecommendationType::Replace,
                    reasoning_template: "Application has no customization ({customization}) and is not {criticality}. Recommend replacing with commercial SaaS solution.".to_string(),
                    effort_boost: Some(EffortLevel::Medium),
                    cost_impact: Some(CostImpact::ModerateSavings),
                    risk_level: Some(RiskLevel::Medium),
                },
                // Rule 4: Replatform heavily customized critical apps
                MigrationRule {
                    priority: 85,
                    name: "Replatform custom applications".to_string(),
                    condition: "customization == VeryHigh AND criticality >= High".to_string(),
                    recommendation: RecommendationType::Replatform,
                    reasoning_template: "Application is {customization} and {criticality}. Recommend cloud-native re-platforming for optimal performance and maintainability.".to_string(),
                    effort_boost: Some(EffortLevel::VeryHigh),
                    cost_impact: Some(CostImpact::SignificantIncrease),
                    risk_level: Some(RiskLevel::VeryHigh),
                },
                // Rule 5: Revise legacy apps with medium customization
                MigrationRule {
                    priority: 80,
                    name: "Revise legacy applications".to_string(),
                    condition: "age > 10 AND customization >= Medium".to_string(),
                    recommendation: RecommendationType::Revise,
                    reasoning_template: "Application is {age} years old with {customization} level. Recommend partial rewrite to modernize for cloud.".to_string(),
                    effort_boost: Some(EffortLevel::High),
                    cost_impact: Some(CostImpact::ModerateIncrease),
                    risk_level: Some(RiskLevel::High),
                },
                // Rule 6: Rehost legacy applications
                MigrationRule {
                    priority: 75,
                    name: "Rehost legacy applications".to_string(),
                    condition: "age > 10 AND customization >= Medium AND criticality >= High".to_string(),
                    recommendation: RecommendationType::Rehost,
                    reasoning_template: "Legacy application ({age} years) with {customization} and {criticality} priority. Recommend lift-and-shift to cloud infrastructure.".to_string(),
                    effort_boost: Some(EffortLevel::Medium),
                    cost_impact: Some(CostImpact::ModerateIncrease),
                    risk_level: Some(RiskLevel::Low),
                },
                // Rule 7: Refactor apps with low-medium customization
                MigrationRule {
                    priority: 70,
                    name: "Refactor for cloud".to_string(),
                    condition: "customization <= Medium AND integration_complexity <= Medium".to_string(),
                    recommendation: RecommendationType::Refactor,
                    reasoning_template: "Application has {customization} level and {integration_complexity} complexity. Recommend minimal changes for cloud compatibility.".to_string(),
                    effort_boost: Some(EffortLevel::Medium),
                    cost_impact: Some(CostImpact::ModerateIncrease),
                    risk_level: Some(RiskLevel::Medium),
                },
                // Rule 8: Retain stable, low-burden applications
                MigrationRule {
                    priority: 60,
                    name: "Retain stable applications".to_string(),
                    condition: "maintenance_burden == Low AND criticality == Medium AND NOT performance_issues".to_string(),
                    recommendation: RecommendationType::Retain,
                    reasoning_template: "Application is stable with {maintenance} maintenance and {criticality} criticality. No immediate migration required.".to_string(),
                    effort_boost: Some(EffortLevel::None),
                    cost_impact: Some(CostImpact::Neutral),
                    risk_level: Some(RiskLevel::VeryLow),
                },
            ],
        }
    }
}
