// Script de test pour vérifier les nouvelles fonctionnalités
const vscode = require('vscode');

async function testProjectDetection() {
    console.log('🔍 Test de détection de projet...');
    
    // Simuler la détection dans le workspace actuel
    try {
        const command = 'ollama.analyzeProject';
        await vscode.commands.executeCommand(command);
        console.log('✅ Détection de projet réussie');
    } catch (error) {
        console.log('❌ Erreur détection:', error.message);
    }
}

async function testContextManagement() {
    console.log('📁 Test de gestion du contexte...');
    
    try {
        const command = 'ollama.exportContext';
        await vscode.commands.executeCommand(command);
        console.log('✅ Export de contexte réussi');
    } catch (error) {
        console.log('❌ Erreur export:', error.message);
    }
}

async function testModelFileGeneration() {
    console.log('🤖 Test de génération ModelFile...');
    
    try {
        const command = 'ollama.generateModelFile';
        await vscode.commands.executeCommand(command);
        console.log('✅ Génération ModelFile réussie');
    } catch (error) {
        console.log('❌ Erreur génération:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Démarrage des tests des nouvelles fonctionnalités\n');
    
    await testProjectDetection();
    await testContextManagement();
    await testModelFileGeneration();
    
    console.log('\n✨ Tests terminés!');
}

module.exports = { runTests };
