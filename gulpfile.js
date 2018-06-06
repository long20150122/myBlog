var gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    gulpSass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    minifycss = require('gulp-minify-css'),
    replace = require('gulp-replace'),
    tinypng = require('gulp-tinypng'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    vinylPaths = require('vinyl-paths'),
    gulpSequence = require('gulp-sequence'),
    fileinclude = require('gulp-file-include'),
    argv = require('minimist')(process.argv.slice(2)),
    browserSync = require('browser-sync').create(),
    BSreload = browserSync.reload,
    spritesmith = require('gulp.spritesmith'),
    merge = require('merge-stream');

var pathName = 'http://127.0.0.1/Activity/',
    // dist = 'dist/' + argv.p + '/',
    // dist = 'dist/' + curDate() + '/' + argv.p + '/',
    dist = 'dist/' + argv.d + '/' + argv.p + '/',
    source = 'src/' + argv.p + '/',
    css = 'css/',
    sass = 'sass/',
    js = 'js/',
    img = 'img/',
    html = '',
    imgBak = source + 'img_bak/',
    dCSS = dist + css,
    dJS = dist + js,
    dIMG = dist + img,
    dHTML = dist,
    sCSS = source + css,
    sSASS = source + sass,
    sJS = source + js,
    sIMG = source + img,
    sHTML = source + html,
    sView = source + '__view/',
    sSprite = source + 'sprite/',
    revPath = './rev/';


var exclude = {
    js: [],
    css: [source + 'css/**/sprite.css']
}




gulp.task('jsUglify', function() {
    var target = [sJS + '*.js'];

    for (var i = 0, l = exclude.js.length; i < l; i++) {
        target.push('!' + exclude.js[i]);
    }

    return gulp.src(target)
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(dJS))
        .pipe(rev.manifest('rev-js.json'))
        .pipe(gulp.dest(revPath));
})



gulp.task('cssSass', function() {
    return new Promise(function(resolve, reject) {
        return setTimeout(function() {
            return gulp.src(sSASS + '**/*.scss')
                .pipe(sourcemaps.init())
                .pipe(gulpSass())
                .on('error', function(e) {
                    return reject(e) && this.end();
                })
                .pipe(sourcemaps.write())
                .pipe(gulp.dest(sCSS))
                .on('end', resolve)
                .pipe(BSreload({ stream: true }));
        }, 500);
    }).catch(function(e) {
        return console.warn(e.messageFormatted);
    });
});



gulp.task('cssMinify', function() {
    var target = [sCSS + '*.css'];

    for (var i = 0, l = exclude.css.length; i < l; i++) {
        target.push('!' + exclude.css[i]);
    }

    return gulp.src(target)
        .pipe(minifycss())
        .pipe(rev())
        .pipe(gulp.dest(dCSS))
        .pipe(rev.manifest('rev-css.json'))
        .pipe(gulp.dest(revPath));
})



gulp.task('imgCopy', function() {
    return gulp.src([sIMG + '**/*.*'])
        .pipe(rev())
        .pipe(gulp.dest(dIMG))
        .pipe(rev.manifest('rev-img.json'))
        .pipe(gulp.dest(revPath));
})



gulp.task('tinypng', function() {
    return gulp.src(sIMG + '**/*.png')
        .pipe(gulp.dest(imgBak))
        .pipe(tinypng('===Key==='))
        .pipe(gulp.dest(sIMG));
});



gulp.task('jsRev', function() {
    return gulp.src([revPath + '*.json', dJS + '**/*.js'])
        .pipe(revCollector())
        .pipe(gulp.dest(dJS));
})



gulp.task('cssRev', function() {
    return gulp.src([revPath + '*.json', dCSS + '**/*.css'])
        .pipe(revCollector())
        .pipe(gulp.dest(dCSS));
})



gulp.task('htmlRev', function() {
    return gulp.src([revPath + '*.json', sView + '*.html'])
        .pipe(replace('../../js', '../../../js'))
        .pipe(replace('../../css', '../../../css'))
        .pipe(revCollector())
        .pipe(gulp.dest(dHTML));
})



gulp.task('htmlInclude', function() {
    return gulp.src(sHTML + '*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: 'frame/public/',
            context: {
                aCss: [],
                aScript: [],
                responsiveUrl: '',
                auth: true,
                booking: true,
                description: '',
                flexible: false
            }
        }))
        .pipe(gulp.dest(sView));
});



gulp.task('htmlUrlReplace', function() {
    return gulp.src(sView + '*.html')
        .pipe(replace(/(src|href)=\"(?!http|javascript|#)/g, '$1="../'))
        .pipe(gulp.dest(sView))
})



gulp.task('allClean', function() {
    return del([dist + '**/*.*', revPath + '**/**']);
})



gulp.task('sprite', function() {
    var spriteData = gulp.src([sSprite + 'i-*.png'])
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.css',
            cssTemplate: 'css.template'
        }));
    var imgStream = spriteData.img
        .pipe(gulp.dest(sIMG));

    var cssStream = spriteData.css
        .pipe(gulp.dest(sCSS));

    return merge(imgStream, cssStream);
});



gulp.task('browserSync', function() {
    browserSync.init({
        /*open: 'external',
        proxy: pathName + sView + 'index.html'*/
        server: "./",
        startPath: sView + "index.html"
    });

    gulp.watch(sJS + '**/*.js').on('change', BSreload);
    gulp.watch(sIMG + '**/*.*', BSreload);
    gulp.watch(sSprite + '**/*.png', gulp.series('sprite'));
    gulp.watch(sSASS + '**/*.scss', gulp.series('cssSass'));
    gulp.watch(sHTML + '*.html').on('change', gulp.series('htmlInclude', 'htmlUrlReplace', BSreload));
})



gulp.task('frameCopy', function() {
    if (!argv.t) {
        console.log('缺少类型参数：-t')
        return false;
    }
    return new Promise(function(resolve, reject) {
        fs.stat(source, function(err, stat) {
            if (err == null) {
                console.log('目录已存在,开始监听...');
                return resolve();
            } else if (err.code == 'ENOENT') {
                gulp.src('frame/' + argv.t + '/**/**')
                    .pipe(gulp.dest(source))
                    .on('end', resolve)
            }
        });
    });
})


gulp.task('pathCheck', function() {
    if (!argv.p) {
        console.log('缺少路径参数：-p')
        return false;
    }
    return new Promise(function(resolve, reject) {
        fs.stat(source, function(err, stat) {
            if (err == null) {
                return resolve();
            } else if (err.code == 'ENOENT') {
                console.log('路径错误');
                return false;
            }
        });
    });
})




gulp.task('dev', gulp.series('pathCheck', 'htmlInclude', 'htmlUrlReplace', 'browserSync'));

gulp.task('build', gulp.series('pathCheck', 'allClean', 'jsUglify', 'cssMinify', 'imgCopy', 'cssRev', 'jsRev', 'htmlInclude', 'htmlRev'));

gulp.task('init', gulp.series('frameCopy', 'dev'));





gulp.task('dev-common-html', function devCommonHtml() {
    if (!argv.type) {
        console.log('缺少类型参数：-type')
        return false;
    }
    return gulp.src('./frame/' + argv.type + '/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: 'frame/public/',
            context: {
                aCss: [],
                aScript: [],
                responsiveUrl: '',
                auth: true,
                booking: true,
                description: '',
                flexible: false
            }
        }))
        .pipe(replace(/(src|href)=\"\.\.\/\.\.\/(css|js)/g, '$1="../common/' + argv.type))
        .pipe(replace(/(src|href)=\"(?!http|\/\/|javascript|#|\.\.\/common)/g, '$1="../' + argv.type + '/'))
        .pipe(gulp.dest('frame/__view/'))
})

gulp.task('dev-common', gulp.series('dev-common-html', function() {
    if (!argv.type) {
        console.log('缺少类型参数：-type')
        return false;
    }

    browserSync.init({
        server: "./",
        startPath: "/frame/__view/index.html"
    });

    gulp.watch('frame/' + argv.type + '/**/*.html').on('change', gulp.series('dev-common-html', BSreload));
    gulp.watch(['frame/' + argv.type + '/**/*.js', 'frame/' + argv.type + '/**/*.css']).on('change', BSreload);
    gulp.watch('frame/common/' + argv.type + '/**/*.*').on('change', BSreload);
    // gulp.watch(sSASS + '**/*.scss').on('change', gulp.series('cssSass', BSreload));
}))


gulp.task('build-common', function() {
    if (!argv.type) {
        console.log('缺少类型参数：-type')
        return false;
    }

    gulp.src(['frame/common/' + argv.type + '/*.*', '!frame/common/' + argv.type + '/*.js'])
        .pipe(gulp.dest('css/'))

    gulp.src(['frame/common/' + argv.type + '/*.js', '!frame/' + argv.type + '/*.min.js'])
        .pipe(uglify())
        .pipe(gulp.dest('js/'))

    return gulp.src('frame/' + argv.type + '/*.min.js')
        .pipe(gulp.dest('js/'))
})

function curDate() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    month = month > 9 ? month : '0' + month;
    var year = date.getFullYear();
    var fullDate = year + '' + month + '' + day;
    return fullDate;
}