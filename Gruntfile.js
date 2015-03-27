module.exports = function(grunt) {
  // load up all of the necessary grunt plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha');      // for client tests
  grunt.loadNpmTasks('grunt-mocha-test'); // for server tests
  // grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-nodemon');
  // grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-shell-spawn');

  // in what order should the files be concatenated
  var clientIncludeOrder = require('./include.conf.js');

  // grunt setup
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // create a task called clean, which
    // deletes all files in the listed folders
    clean: {
      dist: 'dist/*',
      results: 'results/*'
    },

    // what files should be linted
    jshint: {
      gruntfile: 'Gruntfile.js',
      client: clientIncludeOrder,
      server: 'server/**/*.js',
      options: {
        globals: {
          eqeqeq: true
        }
      }
    },

    sass: {
      dev: {
        files: {
          'client/styles/style.css':'client/styles/style.scss'
        }
      },
      dist: {
        files: {
          'dist/client/styles/style.css':'client/styles/style.scss'
        }
      }
    },

    // uglify the files
    uglify: {
      todo: {
        files: {
          'dist/client/lib/output.js': clientIncludeOrder
        }
      }
    },

    // copy necessary files to our dist folder
    copy: {
      // create a task for client files
      client: {
        // Copy everything but the to-be-concatenated todo JS files
        src: [ 'client/**', '!client/lib/**' ],
        dest: 'dist/'
      },
      // create a task for server files
      server: {
        src: [ 'server/**' ],
        dest: 'dist/'
      }
    },

    // concat all the js files
    concat: {
      todo: {
        files: {
          // concat all the todo js files into one file
          'dist/client/lib/output.js': clientIncludeOrder
        }
      }
    },

    // configure the server
    nodemon: {
      dev: {
        script: 'server/server.js'
      }
    },

    // configure karma
    karma: {
      options: {
        configFile: 'karma.conf.js',
        reporters: ['progress', 'coverage']
      },
      // Watch configuration
      watch: {
        background: true,
        reporters: ['progress']
      },
      // Single-run configuration for development
      single: {
        singleRun: true,
      },
    },

    // server test config (not client)
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/server/*.js']
      }
    },

    // create a watch task for tracking
    // any changes to the following files
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: 'jshint:gruntfile'
      },
      client: {
        files: [ 'client/**', '!client/styles/**' ],
        tasks: [ 'build', 'karma:watch:run' ]
      },
      css: {
        files: 'client/styles/style.scss',
        tasks: ['sass']
      },
      server: {
        files: [ 'server/**' ],
        tasks: [ 'build', 'nodemon'],
        options: {
          spawn: false // Restart server
        }
      },
      unitTests: {
        files: [ 'test/unit/**/*.js' ],
        tasks: [ 'karma:watch:run' ]
      },
      integrationTests: {
        files: [ 'test/integration/**/*.js' ],
        tasks: [ 'karma:watch:run' ]
      }
    },

    shell: {
      serverTest: {
        command: 'node server/server.js & ./node_modules/.bin/mocha --bail test/server/ServerSpec.js; pkill -n node;'
      },
      server: {
        command: 'node server/server.js',
        options: {
          async: true
        }
      },
      sleep: {
        command: 'sleep 2'
      },
      prodServer: {
        command: 'git push azure master',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      }
    },

  });

  // Deployment task.
  grunt.registerTask('deploy', ['build', 'test', 'shell:prodServer']);

  // Perform a build
  grunt.registerTask('build', ['jshint', 'clean', 'copy', 'concat', 'uglify']);

  // Run client tests once
  grunt.registerTask('testClient', [ 'karma:single' ]);

  grunt.registerTask('testServer', [
    'shell:server',
    'shell:sleep', // This is a hack. It gives the server time to spin up before the tests run.
    'mochaTest', 
    'shell:server:kill'
  ]);

  // Run all tests once
  grunt.registerTask('test', [ 'testClient', 'shell:serverTest']);

  // Run all tests once
  grunt.registerTask('ci', [ 'karma:ci', 'nodemon' ]);

  // Start watching and run tests when files change
  grunt.registerTask('default', [ 'build', 'nodemon', 'karma:watch:start', 'watch' ]);
};
