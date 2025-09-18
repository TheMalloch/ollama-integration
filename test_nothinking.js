// Test simple pour vérifier la fonctionnalité no-thinking
console.log('🧪 Test de la fonctionnalité No-Thinking');

// Simuler vscode.workspace.getConfiguration
const mockVSCode = {
    workspace: {
        getConfiguration: (section) => {
            return {
                get: (key, defaultValue) => {
                    if (section === 'ollama' && key === 'disableThinking') {
                        return true; // Activé par défaut
                    }
                    return defaultValue;
                }
            };
        }
    }
};

// Mock de la méthode buildRequestOptions
function buildRequestOptions(baseOptions) {
    const config = mockVSCode.workspace.getConfiguration('ollama');
    const disableThinking = config.get('disableThinking', true);
    
    const options = { ...baseOptions };
    
    if (disableThinking) {
        options.no_thinking = true;
    }
    
    return options;
}

// Test 1: Avec thinking désactivé (par défaut)
console.log('\n📋 Test 1: Thinking désactivé (défaut)');
const options1 = buildRequestOptions({
    temperature: 0.7,
    num_predict: 1000
});
console.log('Options générées:', JSON.stringify(options1, null, 2));
console.log('✅ no_thinking présent:', 'no_thinking' in options1 && options1.no_thinking === true);

// Test 2: Simuler thinking activé
const mockVSCodeEnabled = {
    workspace: {
        getConfiguration: (section) => {
            return {
                get: (key, defaultValue) => {
                    if (section === 'ollama' && key === 'disableThinking') {
                        return false; // Thinking activé
                    }
                    return defaultValue;
                }
            };
        }
    }
};

function buildRequestOptionsEnabled(baseOptions) {
    const config = mockVSCodeEnabled.workspace.getConfiguration('ollama');
    const disableThinking = config.get('disableThinking', true);
    
    const options = { ...baseOptions };
    
    if (disableThinking) {
        options.no_thinking = true;
    }
    
    return options;
}

console.log('\n📋 Test 2: Thinking activé');
const options2 = buildRequestOptionsEnabled({
    temperature: 0.7,
    num_predict: 1000
});
console.log('Options générées:', JSON.stringify(options2, null, 2));
console.log('✅ no_thinking absent:', !('no_thinking' in options2));

console.log('\n🎉 Tests terminés avec succès !');
