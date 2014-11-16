/**
 * Copyright (C) 2014 yanni4night.com
 * index.js
 *
 * changelog
 * 2014-11-15[19:54:40]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

"use strict";
require('./nav/nav');
require('./article/article');

angular.module('githubPageApp', ['navModule', 'articleModule']);