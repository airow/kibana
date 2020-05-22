module.exports = function (grunt) {
  grunt.registerTask('_conf:ClusterGroup', function () {

    var ClusterGroup = grunt.option('clustergroup')
    var path = "build/kibana/src/ui/public/courier/saved_object/";
    var confFile = path + "cluster_group_key.js";
    if (ClusterGroup) {
      grunt.file.delete(confFile)
      grunt.file.copy(path + "cluster_group.d/" + ClusterGroup + ".js", confFile)
      grunt.file.delete(path + "cluster_group.d")
    }
  });
};
