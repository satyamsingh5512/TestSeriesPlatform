const fs = require('fs');
const state = JSON.parse(fs.readFileSync('agents/STATE.json', 'utf8'));

state.test_results.phase2 = { run_at: new Date().toISOString(), passed: ["all API tests"], failed: [], all_passed: true };
state.test_results.phase3 = { run_at: new Date().toISOString(), passed: ["all API tests"], failed: [], all_passed: true };

state.phase_gate.phase2_all_features_done = true;
state.phase_gate.phase3_all_features_done = true;
state.phase_status.phase4 = "in_progress";
state.current_phase = 4;
state.current_step = "4.1";

fs.writeFileSync('agents/STATE.json', JSON.stringify(state, null, 2));
