var gulp = require('gulp');
var spawn = require('child_process').spawn;

var Async = require('async');

// require tasks
require('./editor-framework/gulpfile');

// var sublist = [
//     'editor-framework',
// ];
// function gulpsub(task, callback) {
//     var cmdStr = process.platform === 'win32' ? 'gulp.cmd' : 'gulp';

//     function doTask (cwd, done) {
//         console.log('Start sub-task ' + cwd);
//         var child = spawn(cmdStr, [task], {
//             cwd: cwd,
//             stdio: 'inherit'
//         });
//         child.on('exit', function() {
//             console.log('Finish sub-task ' + cwd);
//             return done();
//         });
//     }

//     Async.each( sublist, doTask, function ( err ) {
//         console.log('Finish all sub-tasks.');
//     });
// }

// gulp.task('build', function(done) {
//     gulpsub('build', done);
// });

// gulp.task('build-min', function(done) {
//     gulpsub('build-min', done);
// });
