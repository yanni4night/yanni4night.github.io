request = require 'request'

module.exports = (grunt)->
    (require 'time-grunt') grunt
    (require 'load-grunt-tasks') grunt

    grunt.initConfig {
        src: 'static',
        dist: 'dist',
        html: 'html',
        clean:
            dist: ['<%= dist %>', '*.html']
        jshint:
            options:
                jshintrc: '.jshintrc'
            all:
                src: ['<%= src %>/js/{,*/}/*.js','!<%= src %>/js/lib/*.js']
        browserify:
            js:
                expand: true,
                cwd: '.'
                src: ['<%= src %>/js/*.js'],
                dest: '<%= dist %>'
        uglify:
            js:
                expand: true,
                cwd: '<%= dist %>'
                src: ['<%= src %>/js/*.js'],
                dest: '<%= dist %>'
        less:
            options:
                compress: true
            css:
                expand: true,
                cwd: '.',
                src: ['<%= src %>/css/*.less'],
                dest: '<%= dist %>',
                ext: '.css'
        copy:
            html:
                expand: true,
                cwd: '<%= html %>',
                src: ['*.html'],
                dest: '.'
            jslib:
                expand: true,
                cwd: '.',
                src: ['<%= src %>/js/lib/*.js'],
                dest: '<%= dist %>'
            csslib:
                expand: true,
                cwd: '.',
                src: ['<%= src %>/css/lib/*.css'],
                dest: '<%= dist %>'
        stamp:
            options:
                baseDir: '.'
            html:
                expand: true,
                cwd: '.',
                src: ['*.html'],
                dest: '.'
        htmlmin:
            options: 
                removeComments: true,
                collapseWhitespace: true
            dist:
                expand: true,
                cwd: '.',
                src: ['*.html'],
                dest: '.'
        watch:
            css:
                files: [ '<%= src %>/css/*.less' ],
                tasks: [ 'less' ]
            js:
                files: [ '<%= src %>/js/{,*/}/*.js' ],
                tasks: [ 'jshint','browserify']
            html:
                files: [ '<%= html %>/*.html' ],
                tasks: [ 'copy:html', 'stamp', 'htmlmin']
    }

    grunt.registerTask 'curl-jshint-options', 'Curl options table', ()->
        done = this.async()
        request 'http://www.jshint.com/docs/options/', (error, response, body)=>
            if !error && (response.statusCode == 200)
                optionsTableHTML = (body.match /<table[\s\S]+?<\/table>/g)[0]
                jshintSrc = grunt.file.read 'html/jshint.html'
                jshintSrc = jshintSrc.replace /<table[\s\S]+?<\/table>/, optionsTableHTML
                grunt.file.write 'html/jshint.html', jshintSrc
            else
                console error
            done()



    grunt.registerTask 'default', [ 'clean', 'jshint' , 'browserify', 'uglify', 'uglify', 'less', 'copy', 'stamp', 'htmlmin' ]
