// Simple console info server for the IMGNAI Generator
// This keeps the Replit project active and provides usage instructions

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         IMGNAI Auto-Generator - Replit Environment            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('This is an interactive CLI tool for generating AI images.');
console.log('');
console.log('📋 HOW TO USE:');
console.log('   1. Open the Shell tab in Replit');
console.log('   2. Run: node reverse.mjs');
console.log('   3. Follow the interactive prompts');
console.log('');
console.log('✨ FEATURES:');
console.log('   • 20+ AI models (Gen, Flux, Neo, Illustrious, etc.)');
console.log('   • Fast and High Quality modes');
console.log('   • Multiple aspect ratios');
console.log('   • Automatic Cloudflare bypass');
console.log('   • Session persistence');
console.log('');
console.log('📁 OUTPUT:');
console.log('   Generated images will be saved to: ./outputs/');
console.log('');
console.log('📖 For more details, see README.md');
console.log('');
console.log('🔄 This info server will keep running to maintain the Replit.');
console.log('   To use the image generator, use the Shell tab.\n');

// Keep the process alive
setInterval(() => {
  // Do nothing, just keep alive
}, 60000);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Server interrupted. Shutting down...');
  process.exit(0);
});
