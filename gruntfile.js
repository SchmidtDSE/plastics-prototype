module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8000
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                        'http://localhost:8000/test/test.html'
                    ],
                    timeout: 300000
                }
            }
        }
    });

    grunt.registerTask('default', ['connect', 'qunit']);

};
