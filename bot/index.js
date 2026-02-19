#!/usr/bin/env node
/**
 * Point d'entrée pour les hébergeurs Node.js
 * Lance le bot Python unifié
 */

const { spawn } = require('child_process');

console.log('='.repeat(60));
console.log('  BOT STOAT.CHAT - QUOKKA');
console.log('  Demarrage via Node.js wrapper');
console.log('='.repeat(60));
console.log();

console.log('[INFO] Lancement de bot.py...');
console.log();

// Lancer le bot Python unifié
const pythonProcess = spawn('python3', ['bot.py'], {
    cwd: __dirname,
    stdio: 'inherit'
});

// Gérer les erreurs
pythonProcess.on('error', (err) => {
    console.error('[ERREUR] Impossible de lancer Python:', err.message);
    console.error('[INFO] Verifiez que Python 3 est installe');
    process.exit(1);
});

// Gérer la fin du processus
pythonProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
        console.error(`[ERREUR] Le bot s'est arrete avec le code ${code}`);
        process.exit(code);
    }
    console.log('[INFO] Bot arrete proprement');
});

// Gérer Ctrl+C
process.on('SIGINT', () => {
    console.log('\n[INFO] Arret du bot...');
    pythonProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n[INFO] Arret du bot...');
    pythonProcess.kill('SIGTERM');
});
