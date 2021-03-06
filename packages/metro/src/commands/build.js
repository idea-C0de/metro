/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const MetroApi = require('..');
const TerminalReporter = require('../lib/TerminalReporter');

const {makeAsyncCommand} = require('../cli-utils');
const {Terminal} = require('metro-core');

import typeof Yargs from 'yargs';

exports.command = 'build <entry>';

exports.builder = (yargs: Yargs) => {
  yargs.option('project-roots', {
    alias: 'P',
    type: 'string',
    array: true,
  });
  yargs.option('out', {alias: 'O', type: 'string', demandOption: true});

  yargs.option('platform', {alias: 'p', type: 'string'});
  yargs.option('output-type', {alias: 't', type: 'string'});

  yargs.option('max-workers', {alias: 'j', type: 'number'});

  yargs.option('optimize', {alias: 'z', type: 'boolean'});
  yargs.option('dev', {alias: 'g', type: 'boolean'});

  yargs.option('source-map', {type: 'boolean'});
  yargs.option('source-map-url', {type: 'string'});

  yargs.option('legacy-bundler', {type: 'boolean'});

  yargs.option('config', {alias: 'c', type: 'string'});

  // Deprecated
  yargs.option('reset-cache', {type: 'boolean', describe: null});
};

const term = new Terminal(process.stdout);
const updateReporter = new TerminalReporter(term);

// eslint-disable-next-line lint/no-unclear-flowtypes
exports.handler = makeAsyncCommand(async (argv: any) => {
  // $FlowFixMe: Flow + Promises don't work consistently https://fb.facebook.com/groups/flow/permalink/1772334656148475/
  const config = await MetroApi.loadMetroConfig(argv.config);

  if (argv.projectRoots) {
    config.getProjectRoots = () => argv.projectRoots;
  }

  await MetroApi.runBuild({
    ...argv,
    config,
    onBegin: () => {
      updateReporter.update({
        buildID: '$',
        type: 'bundle_build_started',
        bundleDetails: {
          entryFile: argv.O,
          platform: argv.platform,
          dev: !!argv.dev,
          minify: !!argv.optimize,
          bundleType: 'Bundle',
        },
      });
    },
    onProgress: (transformedFileCount, totalFileCount) => {
      updateReporter.update({
        buildID: '$',
        type: 'bundle_transform_progressed_throttled',
        transformedFileCount,
        totalFileCount,
      });
    },
    onComplete: () => {
      updateReporter.update({
        buildID: '$',
        type: 'bundle_build_done',
      });
    },
  });
});
