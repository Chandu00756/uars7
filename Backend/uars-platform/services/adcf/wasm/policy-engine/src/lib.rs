use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// Policy evaluation result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct PolicyResult {
    #[wasm_bindgen(getter_with_clone)]
    pub decision: String,
    
    #[wasm_bindgen(getter_with_clone)]
    pub reason: String,
    
    pub confidence: f64,
    
    #[wasm_bindgen(getter_with_clone)]
    pub obligations: String, // JSON string
    
    #[wasm_bindgen(getter_with_clone)]
    pub advice: String, // JSON string
}

#[wasm_bindgen]
impl PolicyResult {
    #[wasm_bindgen(constructor)]
    pub fn new(decision: String, reason: String, confidence: f64) -> PolicyResult {
        PolicyResult {
            decision,
            reason,
            confidence,
            obligations: "[]".to_string(),
            advice: "[]".to_string(),
        }
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_obligations(&mut self, obligations: String) {
        self.obligations = obligations;
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_advice(&mut self, advice: String) {
        self.advice = advice;
    }
}

// Policy context for evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyContext {
    pub request_id: String,
    pub timestamp: DateTime<Utc>,
    pub operation: String,
    
    // User information
    pub user_id: String,
    pub user_roles: Vec<String>,
    pub user_groups: Vec<String>,
    pub user_attributes: HashMap<String, serde_json::Value>,
    
    // Device information
    pub device_id: String,
    pub device_type: String,
    pub device_trust: String,
    pub device_attested: bool,
    
    // Network information
    pub ip_address: String,
    pub ip_country: String,
    pub ip_city: String,
    pub network_zone: String,
    pub vpn_detected: bool,
    
    // Session information
    pub session_id: String,
    pub session_age: Duration,
    pub auth_method: String,
    pub mfa_verified: bool,
    
    // Environmental information
    pub time_of_day: String,
    pub day_of_week: String,
    pub business_hours: bool,
    
    // Risk assessment
    pub risk_score: f64,
    pub threat_level: String,
    
    // Resource information
    pub resource_type: String,
    pub resource_id: String,
    pub resource_classification: String,
    pub resource_owner: String,
    pub resource_attributes: HashMap<String, serde_json::Value>,
    
    // Intent information
    pub intent_purpose: Option<String>,
    pub intent_justification: Option<String>,
    pub intent_duration: Option<Duration>,
    
    // Additional context
    pub constraints: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
}

// Policy rule definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub priority: i32,
    pub condition: String, // Boolean expression
    pub effect: String,    // PERMIT, DENY, INDETERMINATE
    pub obligations: Vec<String>,
    pub advice: Vec<String>,
}

// Policy definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Policy {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub target: String, // Target expression
    pub rules: Vec<PolicyRule>,
    pub combining_algorithm: String,
    pub obligations: Vec<String>,
    pub advice: Vec<String>,
}

// Policy engine
#[wasm_bindgen]
pub struct PolicyEngine {
    policies: Vec<Policy>,
    debug_mode: bool,
}

#[wasm_bindgen]
impl PolicyEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PolicyEngine {
        console_log!("Initializing WASM Policy Engine");
        PolicyEngine {
            policies: Vec::new(),
            debug_mode: false,
        }
    }
    
    #[wasm_bindgen]
    pub fn set_debug_mode(&mut self, debug: bool) {
        self.debug_mode = debug;
        if debug {
            console_log!("Debug mode enabled");
        }
    }
    
    #[wasm_bindgen]
    pub fn load_policy(&mut self, policy_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<Policy>(policy_json) {
            Ok(policy) => {
                if self.debug_mode {
                    console_log!("Loaded policy: {} ({})", policy.name, policy.id);
                }
                self.policies.push(policy);
                Ok(())
            }
            Err(e) => {
                let error_msg = format!("Failed to parse policy: {}", e);
                console_log!("{}", error_msg);
                Err(JsValue::from_str(&error_msg))
            }
        }
    }
    
    #[wasm_bindgen]
    pub fn load_policies(&mut self, policies_json: &str) -> Result<(), JsValue> {
        match serde_json::from_str::<Vec<Policy>>(policies_json) {
            Ok(policies) => {
                for policy in policies {
                    if self.debug_mode {
                        console_log!("Loading policy: {} ({})", policy.name, policy.id);
                    }
                    self.policies.push(policy);
                }
                console_log!("Loaded {} policies", self.policies.len());
                Ok(())
            }
            Err(e) => {
                let error_msg = format!("Failed to parse policies: {}", e);
                console_log!("{}", error_msg);
                Err(JsValue::from_str(&error_msg))
            }
        }
    }
    
    #[wasm_bindgen]
    pub fn evaluate(&self, context_json: &str) -> Result<PolicyResult, JsValue> {
        if self.debug_mode {
            console_log!("Starting policy evaluation");
        }
        
        let context: PolicyContext = match serde_json::from_str(context_json) {
            Ok(ctx) => ctx,
            Err(e) => {
                let error_msg = format!("Failed to parse context: {}", e);
                console_log!("{}", error_msg);
                return Err(JsValue::from_str(&error_msg));
            }
        };
        
        // Find applicable policies
        let applicable_policies: Vec<&Policy> = self.policies
            .iter()
            .filter(|policy| self.is_policy_applicable(policy, &context))
            .collect();
        
        if self.debug_mode {
            console_log!("Found {} applicable policies", applicable_policies.len());
        }
        
        if applicable_policies.is_empty() {
            return Ok(PolicyResult::new(
                "INDETERMINATE".to_string(),
                "No applicable policies found".to_string(),
                0.0
            ));
        }
        
        // Evaluate each applicable policy
        let mut policy_results = Vec::new();
        for policy in applicable_policies {
            let result = self.evaluate_policy(policy, &context)?;
            policy_results.push(result);
        }
        
        // Combine results using the appropriate algorithm
        let final_result = self.combine_policy_results(policy_results)?;
        
        if self.debug_mode {
            console_log!("Final decision: {}", final_result.decision);
        }
        
        Ok(final_result)
    }
    
    #[wasm_bindgen]
    pub fn clear_policies(&mut self) {
        self.policies.clear();
        console_log!("Cleared all policies");
    }
    
    #[wasm_bindgen]
    pub fn get_policy_count(&self) -> usize {
        self.policies.len()
    }
}

impl PolicyEngine {
    fn is_policy_applicable(&self, policy: &Policy, context: &PolicyContext) -> bool {
        if policy.target.is_empty() {
            return true;
        }
        
        // Simple target evaluation - in production, use a proper expression evaluator
        self.evaluate_expression(&policy.target, context).unwrap_or(false)
    }
    
    fn evaluate_policy(&self, policy: &Policy, context: &PolicyContext) -> Result<PolicyResult, JsValue> {
        if self.debug_mode {
            console_log!("Evaluating policy: {}", policy.name);
        }
        
        let mut rule_results = Vec::new();
        
        // Evaluate each rule
        for rule in &policy.rules {
            let rule_result = self.evaluate_rule(rule, context)?;
            rule_results.push(rule_result);
        }
        
        // Combine rule results using the policy's combining algorithm
        self.combine_rule_results(&policy.combining_algorithm, rule_results)
    }
    
    fn evaluate_rule(&self, rule: &PolicyRule, context: &PolicyContext) -> Result<PolicyResult, JsValue> {
        if self.debug_mode {
            console_log!("Evaluating rule: {}", rule.name);
        }
        
        // Evaluate the rule condition
        let condition_result = self.evaluate_expression(&rule.condition, context)?;
        
        if condition_result {
            let mut result = PolicyResult::new(
                rule.effect.clone(),
                format!("Rule '{}' matched", rule.name),
                1.0
            );
            
            if !rule.obligations.is_empty() {
                result.set_obligations(serde_json::to_string(&rule.obligations).unwrap_or_default());
            }
            
            if !rule.advice.is_empty() {
                result.set_advice(serde_json::to_string(&rule.advice).unwrap_or_default());
            }
            
            Ok(result)
        } else {
            Ok(PolicyResult::new(
                "NOTAPPLICABLE".to_string(),
                format!("Rule '{}' condition not met", rule.name),
                0.0
            ))
        }
    }
    
    fn evaluate_expression(&self, expression: &str, context: &PolicyContext) -> Result<bool, JsValue> {
        // Simple expression evaluator - in production, use a proper parser/evaluator
        // This is a basic implementation for demonstration
        
        if expression.is_empty() {
            return Ok(true);
        }
        
        // Handle simple expressions
        if expression == "true" {
            return Ok(true);
        }
        
        if expression == "false" {
            return Ok(false);
        }
        
        // Check for common patterns
        if expression.contains("user.roles") && expression.contains("admin") {
            return Ok(context.user_roles.contains(&"admin".to_string()));
        }
        
        if expression.contains("device.attested") && expression.contains("true") {
            return Ok(context.device_attested);
        }
        
        if expression.contains("mfa.verified") && expression.contains("true") {
            return Ok(context.mfa_verified);
        }
        
        if expression.contains("business_hours") && expression.contains("true") {
            return Ok(context.business_hours);
        }
        
        if expression.contains("risk_score") {
            if expression.contains("< 5.0") {
                return Ok(context.risk_score < 5.0);
            }
            if expression.contains("> 7.0") {
                return Ok(context.risk_score > 7.0);
            }
        }
        
        if expression.contains("classification") {
            if expression.contains("classified") && expression.contains("!=") {
                return Ok(context.resource_classification != "classified");
            }
            if expression.contains("public") && expression.contains("==") {
                return Ok(context.resource_classification == "public");
            }
        }
        
        // Default to false for unrecognized expressions
        if self.debug_mode {
            console_log!("Unknown expression: {}", expression);
        }
        
        Ok(false)
    }
    
    fn combine_rule_results(&self, algorithm: &str, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        match algorithm {
            "permit-overrides" => self.permit_overrides(results),
            "deny-overrides" => self.deny_overrides(results),
            "first-applicable" => self.first_applicable(results),
            "permit-unless-deny" => self.permit_unless_deny(results),
            "deny-unless-permit" => self.deny_unless_permit(results),
            _ => {
                console_log!("Unknown combining algorithm: {}, using deny-overrides", algorithm);
                self.deny_overrides(results)
            }
        }
    }
    
    fn permit_overrides(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        let mut permits = Vec::new();
        let mut denies = Vec::new();
        let mut indeterminates = Vec::new();
        
        for result in results {
            match result.decision.as_str() {
                "PERMIT" => permits.push(result),
                "DENY" => denies.push(result),
                "INDETERMINATE" => indeterminates.push(result),
                _ => {} // NOTAPPLICABLE
            }
        }
        
        if !permits.is_empty() {
            Ok(permits.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else if !denies.is_empty() {
            Ok(denies.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else if !indeterminates.is_empty() {
            Ok(indeterminates.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else {
            Ok(PolicyResult::new(
                "INDETERMINATE".to_string(),
                "No applicable rules".to_string(),
                0.0
            ))
        }
    }
    
    fn deny_overrides(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        let mut permits = Vec::new();
        let mut denies = Vec::new();
        let mut indeterminates = Vec::new();
        
        for result in results {
            match result.decision.as_str() {
                "PERMIT" => permits.push(result),
                "DENY" => denies.push(result),
                "INDETERMINATE" => indeterminates.push(result),
                _ => {} // NOTAPPLICABLE
            }
        }
        
        if !denies.is_empty() {
            Ok(denies.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else if !permits.is_empty() {
            Ok(permits.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else if !indeterminates.is_empty() {
            Ok(indeterminates.into_iter().max_by(|a, b| a.confidence.partial_cmp(&b.confidence).unwrap_or(std::cmp::Ordering::Equal)).unwrap())
        } else {
            Ok(PolicyResult::new(
                "INDETERMINATE".to_string(),
                "No applicable rules".to_string(),
                0.0
            ))
        }
    }
    
    fn first_applicable(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        for result in results {
            if result.decision != "NOTAPPLICABLE" {
                return Ok(result);
            }
        }
        
        Ok(PolicyResult::new(
            "INDETERMINATE".to_string(),
            "No applicable rules".to_string(),
            0.0
        ))
    }
    
    fn permit_unless_deny(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        for result in &results {
            if result.decision == "DENY" {
                return Ok(result.clone());
            }
        }
        
        Ok(PolicyResult::new(
            "PERMIT".to_string(),
            "Permit unless deny".to_string(),
            1.0
        ))
    }
    
    fn deny_unless_permit(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        for result in &results {
            if result.decision == "PERMIT" {
                return Ok(result.clone());
            }
        }
        
        Ok(PolicyResult::new(
            "DENY".to_string(),
            "Deny unless permit".to_string(),
            1.0
        ))
    }
    
    fn combine_policy_results(&self, results: Vec<PolicyResult>) -> Result<PolicyResult, JsValue> {
        // Use deny-overrides for combining policy results
        self.deny_overrides(results)
    }
}

// Utility functions
#[wasm_bindgen]
pub fn create_sample_policy() -> String {
    let sample_policy = Policy {
        id: "sample-policy-001".to_string(),
        name: "Sample Access Policy".to_string(),
        version: "1.0.0".to_string(),
        description: "A sample policy for demonstration".to_string(),
        target: "true".to_string(),
        combining_algorithm: "deny-overrides".to_string(),
        rules: vec![
            PolicyRule {
                id: "rule-001".to_string(),
                name: "Require MFA for classified data".to_string(),
                description: "Multi-factor authentication is required for accessing classified data".to_string(),
                priority: 100,
                condition: "classification == 'classified' && mfa.verified == true".to_string(),
                effect: "PERMIT".to_string(),
                obligations: vec!["log_access".to_string()],
                advice: vec!["remind_classification".to_string()],
            },
            PolicyRule {
                id: "rule-002".to_string(),
                name: "Deny high-risk access".to_string(),
                description: "Deny access when risk score is too high".to_string(),
                priority: 200,
                condition: "risk_score > 7.0".to_string(),
                effect: "DENY".to_string(),
                obligations: vec!["alert_security".to_string()],
                advice: vec![],
            },
        ],
        obligations: vec![],
        advice: vec![],
    };
    
    serde_json::to_string(&sample_policy).unwrap_or_default()
}

#[wasm_bindgen]
pub fn create_sample_context() -> String {
    let sample_context = PolicyContext {
        request_id: "req-12345".to_string(),
        timestamp: Utc::now(),
        operation: "read".to_string(),
        user_id: "user-123".to_string(),
        user_roles: vec!["analyst".to_string()],
        user_groups: vec!["research".to_string()],
        user_attributes: HashMap::new(),
        device_id: "device-456".to_string(),
        device_type: "laptop".to_string(),
        device_trust: "trusted".to_string(),
        device_attested: true,
        ip_address: "192.168.1.100".to_string(),
        ip_country: "US".to_string(),
        ip_city: "Seattle".to_string(),
        network_zone: "internal".to_string(),
        vpn_detected: false,
        session_id: "session-789".to_string(),
        session_age: Duration::hours(2),
        auth_method: "certificate".to_string(),
        mfa_verified: true,
        time_of_day: "afternoon".to_string(),
        day_of_week: "Tuesday".to_string(),
        business_hours: true,
        risk_score: 3.5,
        threat_level: "low".to_string(),
        resource_type: "data_capsule".to_string(),
        resource_id: "capsule-001".to_string(),
        resource_classification: "internal".to_string(),
        resource_owner: "user-456".to_string(),
        resource_attributes: HashMap::new(),
        intent_purpose: Some("research analysis".to_string()),
        intent_justification: Some("Required for project XYZ".to_string()),
        intent_duration: Some(Duration::hours(4)),
        constraints: HashMap::new(),
        metadata: HashMap::new(),
    };
    
    serde_json::to_string(&sample_context).unwrap_or_default()
}

// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("UARS Policy Engine WASM module initialized");
}
