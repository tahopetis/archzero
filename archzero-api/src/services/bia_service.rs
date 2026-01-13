use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::Utc;

use crate::models::bia::*;
use crate::error::AppError;

pub struct BIAService {
    // In-memory profile storage (will be loaded from config files)
    profiles: HashMap<String, BIAProfile>,
}

impl BIAService {
    pub fn new() -> Self {
        let mut service = Self {
            profiles: HashMap::new(),
        };

        // Load default profiles
        if let Ok(healthcare) = service.load_profile("healthcare") {
            service.profiles.insert("healthcare".to_string(), healthcare);
        }
        if let Ok(financial) = service.load_profile("financial") {
            service.profiles.insert("financial".to_string(), financial);
        }
        if let Ok(manufacturing) = service.load_profile("manufacturing") {
            service.profiles.insert("manufacturing".to_string(), manufacturing);
        }

        service
    }

    /// Load a BIA profile from config file
    fn load_profile(&self, name: &str) -> Result<BIAProfile> {
        // For now, return default profiles
        // In production, these would be loaded from config/bia_*.json files
        match name {
            "healthcare" => Ok(Self::healthcare_profile()),
            "financial" => Ok(Self::financial_profile()),
            "manufacturing" => Ok(Self::manufacturing_profile()),
            _ => Err(anyhow::anyhow!("Unknown BIA profile: {}", name)),
        }
    }

    /// Get all available profile names
    pub fn list_profiles(&self) -> Vec<String> {
        self.profiles.keys().cloned().collect()
    }

    /// Get a specific profile
    pub fn get_profile(&self, name: &str) -> Option<&BIAProfile> {
        self.profiles.get(name)
    }

    /// Calculate BIA assessment for a card
    pub fn calculate_assessment(
        &self,
        card_id: Uuid,
        profile_name: &str,
        responses: Vec<BIAResponse>,
        assessed_by: Uuid,
    ) -> Result<BIAAssessment> {
        let profile = self.get_profile(profile_name)
            .ok_or_else(|| AppError::NotFound(format!("BIA profile '{}' not found", profile_name)))?;

        // Calculate dimension scores
        let mut dimension_scores = Vec::new();
        let response_map: HashMap<String, &BIAResponse> = responses
            .iter()
            .map(|r| (r.question_id.clone(), r))
            .collect();

        for dimension in &profile.dimensions {
            let dimension_score = self.calculate_dimension_score(&dimension, &response_map)?;
            dimension_scores.push(dimension_score);
        }

        // Calculate overall score based on aggregation strategy
        let overall_score = match profile.aggregation_strategy {
            AggregationStrategy::Max => {
                dimension_scores
                    .iter()
                    .map(|d| d.score)
                    .fold(0.0_f64, |acc, score| acc.max(score))
            }
            AggregationStrategy::WeightedAvg => {
                let total_weight: f64 = dimension_scores.iter().map(|d| d.weight).sum();
                if total_weight > 0.0 {
                    dimension_scores.iter().map(|d| d.weighted_score).sum::<f64>() / total_weight
                } else {
                    0.0
                }
            }
            AggregationStrategy::Sum => {
                dimension_scores.iter().map(|d| d.score).sum()
            }
        };

        let criticality_level = CriticalityLevel::from_score(overall_score);

        Ok(BIAAssessment {
            id: Uuid::new_v4(),
            card_id,
            profile_name: profile_name.to_string(),
            assessed_by,
            assessed_at: Utc::now(),
            responses,
            dimension_scores,
            overall_score,
            criticality_level,
        })
    }

    /// Calculate score for a single dimension
    fn calculate_dimension_score(
        &self,
        dimension: &BIADimension,
        responses: &HashMap<String, &BIAResponse>,
    ) -> Result<DimensionScore> {
        let mut total_score = 0.0;
        let mut total_weight = 0.0;
        let mut answered_count = 0;

        for question in &dimension.questions {
            if let Some(response) = responses.get(&question.id) {
                total_score += response.score * question.weight;
                total_weight += question.weight;
                answered_count += 1;
            }
        }

        let score = if total_weight > 0.0 {
            total_score / total_weight
        } else {
            0.0
        };

        let weighted_score = score * dimension.weight;

        Ok(DimensionScore {
            dimension_id: dimension.id.clone(),
            dimension_name: dimension.name.clone(),
            score,
            weight: dimension.weight,
            weighted_score,
        })
    }

    // Default profile definitions
    fn healthcare_profile() -> BIAProfile {
        BIAProfile {
            name: "Healthcare".to_string(),
            industry: "Healthcare".to_string(),
            dimensions: vec![
                BIADimension {
                    id: "patient_safety".to_string(),
                    name: "Patient Safety".to_string(),
                    weight: 0.35,
                    description: "Impact on patient safety and care delivery".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "q1".to_string(),
                            text: "Does this system directly support patient care delivery?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Critical Path".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_support".to_string(), label: "Yes - Support System".to_string(), score: 0.7 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.2 },
                            ],
                            required: true,
                        },
                        BIAQuestion {
                            id: "q2".to_string(),
                            text: "What is the potential impact on patient safety if this system fails?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "life_threatening".to_string(), label: "Life-threatening".to_string(), score: 1.0 },
                                ResponseOption { value: "serious_harm".to_string(), label: "Serious harm".to_string(), score: 0.8 },
                                ResponseOption { value: "moderate_impact".to_string(), label: "Moderate impact".to_string(), score: 0.5 },
                                ResponseOption { value: "minimal_impact".to_string(), label: "Minimal impact".to_string(), score: 0.2 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "data_security".to_string(),
                    name: "Data Security & Privacy (HIPAA)".to_string(),
                    weight: 0.30,
                    description: "Handling of PHI and sensitive patient data".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "q3".to_string(),
                            text: "Does this system store or process Protected Health Information (PHI)?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_primary".to_string(), label: "Yes - Primary system of record".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_secondary".to_string(), label: "Yes - Secondary/replica".to_string(), score: 0.7 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                        BIAQuestion {
                            id: "q4".to_string(),
                            text: "What volume of patient records does this system handle?".to_string(),
                            weight: 0.8,
                            response_options: vec![
                                ResponseOption { value: "all_patients".to_string(), label: "All patients".to_string(), score: 1.0 },
                                ResponseOption { value: "most_patients".to_string(), label: "Most patients (>50%)".to_string(), score: 0.7 },
                                ResponseOption { value: "some_patients".to_string(), label: "Some patients (<50%)".to_string(), score: 0.4 },
                                ResponseOption { value: "no_records".to_string(), label: "No patient records".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "operational".to_string(),
                    name: "Operational Impact".to_string(),
                    weight: 0.20,
                    description: "Impact on hospital/clinic operations".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "q5".to_string(),
                            text: "How many users/departments rely on this system daily?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "enterprise_wide".to_string(), label: "Enterprise-wide (>1000 users)".to_string(), score: 1.0 },
                                ResponseOption { value: "many_depts".to_string(), label: "Multiple departments (100-1000)".to_string(), score: 0.7 },
                                ResponseOption { value: "single_dept".to_string(), label: "Single department (10-100)".to_string(), score: 0.4 },
                                ResponseOption { value: "few_users".to_string(), label: "Few users (<10)".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "financial".to_string(),
                    name: "Financial Impact".to_string(),
                    weight: 0.15,
                    description: "Revenue and billing impact".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "q6".to_string(),
                            text: "Does this system directly impact revenue/billing operations?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Critical to billing".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_indirect".to_string(), label: "Yes - Indirect impact".to_string(), score: 0.5 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                    ],
                },
            ],
            aggregation_strategy: AggregationStrategy::WeightedAvg,
        }
    }

    fn financial_profile() -> BIAProfile {
        BIAProfile {
            name: "Financial Services".to_string(),
            industry: "Financial".to_string(),
            dimensions: vec![
                BIADimension {
                    id: "regulatory_compliance".to_string(),
                    name: "Regulatory Compliance".to_string(),
                    weight: 0.35,
                    description: "SEC, FINRA, PCI-DSS compliance requirements".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "f1".to_string(),
                            text: "Is this system required for regulatory reporting?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Mandated by regulation".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_support".to_string(), label: "Yes - Supporting system".to_string(), score: 0.6 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "transaction_processing".to_string(),
                    name: "Transaction Processing".to_string(),
                    weight: 0.30,
                    description: "Impact on trading and transaction flows".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "f2".to_string(),
                            text: "Does this system process live transactions?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_realtime".to_string(), label: "Yes - Real-time trading".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_batch".to_string(), label: "Yes - Batch processing".to_string(), score: 0.6 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "risk_management".to_string(),
                    name: "Risk Management".to_string(),
                    weight: 0.20,
                    description: "Impact on risk assessment and monitoring".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "f3".to_string(),
                            text: "Is this system part of the risk management framework?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Core risk system".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_support".to_string(), label: "Yes - Support system".to_string(), score: 0.5 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "customer_impact".to_string(),
                    name: "Customer Impact".to_string(),
                    weight: 0.15,
                    description: "Impact on customer-facing services".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "f4".to_string(),
                            text: "What is the customer-facing impact of downtime?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "severe".to_string(), label: "Severe - Cannot serve customers".to_string(), score: 1.0 },
                                ResponseOption { value: "moderate".to_string(), label: "Moderate - Degraded service".to_string(), score: 0.5 },
                                ResponseOption { value: "minimal".to_string(), label: "Minimal - Internal impact only".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                    ],
                },
            ],
            aggregation_strategy: AggregationStrategy::WeightedAvg,
        }
    }

    fn manufacturing_profile() -> BIAProfile {
        BIAProfile {
            name: "Manufacturing".to_string(),
            industry: "Manufacturing".to_string(),
            dimensions: vec![
                BIADimension {
                    id: "production_impact".to_string(),
                    name: "Production Impact".to_string(),
                    weight: 0.40,
                    description: "Impact on manufacturing and production lines".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "m1".to_string(),
                            text: "Does this system control production equipment?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_direct".to_string(), label: "Yes - Direct control".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_monitoring".to_string(), label: "Yes - Monitoring only".to_string(), score: 0.6 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.1 },
                            ],
                            required: true,
                        },
                        BIAQuestion {
                            id: "m2".to_string(),
                            text: "What happens to production if this system fails?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "stop_production".to_string(), label: "Production stops immediately".to_string(), score: 1.0 },
                                ResponseOption { value: "degraded".to_string(), label: "Degraded production".to_string(), score: 0.6 },
                                ResponseOption { value: "manual_workaround".to_string(), label: "Manual workaround available".to_string(), score: 0.3 },
                                ResponseOption { value: "no_impact".to_string(), label: "No impact".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "safety".to_string(),
                    name: "Safety & Environmental".to_string(),
                    weight: 0.30,
                    description: "Impact on worker safety and environmental compliance".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "m3".to_string(),
                            text: "Does this system monitor safety systems or environmental controls?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Critical safety system".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_monitoring".to_string(), label: "Yes - Monitoring system".to_string(), score: 0.6 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "supply_chain".to_string(),
                    name: "Supply Chain".to_string(),
                    weight: 0.20,
                    description: "Impact on supply chain and inventory management".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "m4".to_string(),
                            text: "Does this system manage inventory or supply chain?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_primary".to_string(), label: "Yes - Primary system".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_integration".to_string(), label: "Yes - Integration point".to_string(), score: 0.5 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
                BIADimension {
                    id: "quality".to_string(),
                    name: "Quality Control".to_string(),
                    weight: 0.10,
                    description: "Impact on product quality and testing".to_string(),
                    questions: vec![
                        BIAQuestion {
                            id: "m5".to_string(),
                            text: "Is this system part of quality control processes?".to_string(),
                            weight: 1.0,
                            response_options: vec![
                                ResponseOption { value: "yes_critical".to_string(), label: "Yes - Critical to QC".to_string(), score: 1.0 },
                                ResponseOption { value: "yes_support".to_string(), label: "Yes - Support system".to_string(), score: 0.4 },
                                ResponseOption { value: "no".to_string(), label: "No".to_string(), score: 0.0 },
                            ],
                            required: true,
                        },
                    ],
                },
            ],
            aggregation_strategy: AggregationStrategy::WeightedAvg,
        }
    }
}
