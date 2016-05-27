// Gulp plugin setup
var gulp = require('gulp');

// Watches single files
var watch = require('gulp-watch');

// This will keeps pipes working after error event
var plumber = require('gulp-plumber');

// Add CSS import functionality to Shopify theme
var cssimport = require("gulp-cssimport");

// Linting
var jshint = require('gulp-jshint');

// Minify JS files
var uglify = require('gulp-uglify');

// Optimizing images
var Imagemin = require('gulp-imagemin');

// Control stream
var map = require('map-stream');

// Rename glob
var rename = require("gulp-rename");

var gulpShopify = require('gulp-shopify-upload');

// Sensitive data
var shopify_key = '';
var shopify_pass = '';
var shopify_name = '';
var shopify_themeid = '';

var themeBase = 'theme/'; // Assign shopify theme base folder with trailing slash
var scssBase = 'scss/'; // Assign scss base folder with trailing slash

var minify = function(event){
	return gulp.src(event.path)
						 .pipe(uglify())
			 			 .pipe(rename({extname:'.min.js'}))
						 .pipe(gulp.dest(themeBase + 'assets'));
}

var jsLinting = function(event){
	var success = true;
	return gulp.src(event.path)
						 .pipe(plumber())
						 .pipe(jshint())
						 .pipe(jshint.reporter('jshint-stylish'))
						 .pipe(map(function(file, cb){
						 		if ( !file.jshint.success ) {
                	success = false;
            		}
						 		cb(null, file);
						 		// stream ends here
						 }))
						 .on('end', function(){
						 		if(!success){
						 			console.log('JavaScript linting failed, please see above message to fix your code.');
						 		} else {
						 			console.log('There\'s no error in your code, good job.');
						 			minify(event);
						 		}
						 });
}

gulp.task('styles', function(){
	var cssImporter = gulp.watch(scssBase + '**/*.*');
	cssImporter.on('change', function(event){
		console.log("Style changed on " + event.path);
		gulp.src(scssBase + '/**/[^_]*.*')
			.pipe(cssimport())
			.pipe(rename({dirname: ''}))
			.pipe(gulp.dest(themeBase + 'assets/'));
	});
});

gulp.task('jsWatch', function(){
	return gulp.watch([themeBase + 'assets/*.js', '!'+ themeBase +'assets/*.min.js'], {base: themeBase}).on('change', function(event){
		jsLinting(event);
	});
});

gulp.task('imageMin', function(){
	var imageWatcher = gulp.watch(themeBase + 'assets/*.{jpg,png}');
	imageWatcher.on('change', function(event){
		if(event.type == "added"){
			console.log("optimizing image: "+event.path);
			gulp.src(event.path)
					.pipe(Imagemin())
					.pipe(gulp.dest(themeBase + 'assets'));
		}
	});
});

var watchfiles = [
  './'+ themeBase +'+(assets|layout|config|snippets|templates|locales)/**',
  '!./'+ themeBase +'+(assets|layout|config|snippets|templates|locales)/*+(REMOTE|LOCAL|BASE|BACKUP)*.*',
  '!./'+ themeBase +'+(assets|layout|config|snippets|templates|locales)/*.orig',
];

gulp.task('shopifywatch', function() {
	  var options = {
		  "basePath": themeBase
		};
    return watch(watchfiles, {base: themeBase})
    .pipe(gulpShopify(shopify_key, shopify_pass, shopify_name + '.myshopify.com', shopify_themeid, options))
});

// Default gulp action when gulp is run
gulp.task('default', [
        'jsWatch',
        'imageMin',
        'styles',
        'shopifywatch'
]);
