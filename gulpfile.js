const gulp = require('gulp')
const babel = require('gulp-babel')
const del = require('del')
const mocha = require('gulp-mocha')
const runSequence = require('run-sequence')

gulp
  .task('default', ['release'])
  .task('release', () => {
    return runSequence('clean', 'test', 'build')
  })
  .task('clean', () => {
    return del([
      'dist',
    ])
  })
  .task('build', [
    'build:index',
    'build:src',
  ])
  .task('build:index', () => {
    return gulp.src([
      'index.js',
    ])
      .pipe(babel({
        presets: ['es2015'],
      }))
      .pipe(gulp.dest('dist'))
  })
  .task('build:src', () => {
    return gulp.src([
      'src/**',
    ], {
      base: '.',
    })
      .pipe(babel({
        presets: ['es2015'],
      }))
      .pipe(gulp.dest('dist'))
  })

gulp
  .task('test', ['mocha'])
  .task('mocha', () => {
    return gulp.src('test/*.js')
      .pipe(mocha())
  })