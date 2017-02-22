module.exports = function (grunt) {
  grunt.registerTask('_build:removeConfig', function () {

    grunt.file.delete("build/kibana/config")

    grunt.file.delete("build/kibana/node_modules")
    
  });
};
