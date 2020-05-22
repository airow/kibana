module.exports = function (grunt) {
  let { flatten } = require('lodash');

  grunt.registerTask('build', 'Build packages', function () {
    grunt.task.run(flatten([
      'clean:build',
      'clean:target',
      grunt.option('skip-downloadNodeBuilds') ? [] : [
        '_build:downloadNodeBuilds',
        '_build:extractNodeBuilds',
      ],
      'copy:devSource',
      '_conf:ClusterGroup',
      'babel:build',
      '_build:babelOptions',
      '_build:plugins',
      '_build:data',
      '_build:packageJson',
      '_build:readme',
      '_build:babelCache',
      grunt.option('skip-installNpmDeps') ? ['copy:node_modules'] : ['_build:installNpmDeps'],
      '_build:removePkgJsonDeps',
      'clean:testsFromModules',
      'run:optimizeBuild',
      'stop:optimizeBuild',
      // '_build:versionedLinks',
      // '_build:osShellScripts',
      grunt.option('remove-config') ? ['_build:removeConfig'] : [],
      grunt.option('skip-archives') ? [] : ['_build:archives'],
      grunt.option('skip-os-packages') ? [] : [
        '_build:pleaseRun',
        '_build:osPackages',
      ],
      '_build:shasums'
    ]));
  });

  grunt.registerTask('build-ok', 'Build packages', function () {
    grunt.task.run(flatten([
      // 'clean:build',
      // 'clean:target',
      grunt.option('skip-downloadNodeBuilds') ? [] : [
        '_build:downloadNodeBuilds',
        '_build:extractNodeBuilds',
      ],
      'copy:devSource',
      'babel:build',
      '_build:babelOptions',
      '_build:plugins',
      '_build:data',
      '_build:packageJson',
      '_build:readme',
      '_build:babelCache',
      //'_build:installNpmDeps',
      '_build:removePkgJsonDeps',
      'clean:testsFromModules',
      'run:optimizeBuild',
      //'stop:optimizeBuild',
      grunt.option('skip-archives') ? [] : [
        '_build:versionedLinks',
        '_build:osShellScripts'
      ],
      grunt.option('remove-config') ? ['_build:removeConfig'] : [],
      grunt.option('skip-archives') ? [] : ['_build:archives'],
      grunt.option('skip-os-packages') ? [] : [
        '_build:pleaseRun',
        '_build:osPackages',
      ],
      '_build:shasums'
    ]));
  });
};
