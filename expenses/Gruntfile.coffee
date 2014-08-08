module.exports = (grunt) ->
    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        watch:
            options:
                livereload: false

            scss:
                files: ["src/partition.scss"]
                task: ["sass"]

            coffee:
                files: "src/*.coffee"
                tasks: ["coffee"]

        sass:
            dist:
                options:
                    style: "expanded",
                    loadPath: require("node-bourbon").includePaths

                files:
                    "build/partition.css": "src/partition.scss"

        coffee:
            compile:
                options:
                    join: true
                    bare: true
                    map: true

                files:
                    "build/partition.js": "src/*.coffee"

    grunt.loadNpmTasks "grunt-contrib-coffee"
    grunt.loadNpmTasks "grunt-contrib-sass"
    grunt.loadNpmTasks "grunt-contrib-watch"

    # compiling project with default Grunt call
    grunt.registerTask "default", ["sass", "coffee"]