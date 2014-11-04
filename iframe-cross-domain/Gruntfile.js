/**
 * Copyright (C) 2014 yanni4night.com
 * Gruntfile.js
 *
 * changelog
 * 2014-11-04[15:36:26]:authorized
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
            main: {
                src: 'css/main.less',
                dest: 'css/main.css'
            }
        },
        watch: {
            less: {
                files: ['css/*.less'],
                tasks: ['less']
            },
            browserify: {
                files: ['script/*.js'],
                tasks: ['browserify']
            }
        },
        browserify: {
            js: {
                src: 'script/step.js',
                dest: 'main.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['less', 'browserify']);
};