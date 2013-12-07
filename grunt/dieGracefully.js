module.exports = function(grunt) {
  Error.stackTraceLimit = 400;
  process.on('uncaughtException', function(err) {
    console.log('uncaught exception', err.stack);
    process.kill(process.pid, 'SIGINT');
  });
};