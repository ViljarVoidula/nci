'use strict';

var expect = require('expect.js'),
	path = require('path'),
	fs = require('fs'),
	createScm = require('../lib/scm').createScm,
	SpawnCommand = require('../lib/command/spawn').Command,
	mercurialRevs = require('./helpers').mercurialRevs;


['mercurial'].forEach(function(type) {
	describe(type, function() {
		var data = getTestData(type),
			repositoryName = 'test-repository',
			repositoryPath = path.join(path.join(__dirname, 'repos'), repositoryName);

		function rmdir(dir, callback) {
			new SpawnCommand().run({cmd: 'rm', args: ['-R', dir]}, callback);
		}

		it('remove test repository dir if it exists', function(done) {
			if (fs.exists(repositoryPath, function(isExists) {
				if (isExists) {
					rmdir(repositoryPath, done);
				} else {
					done();
				}
			}));
		});

		var scm;

		it('create scm instance attached to new repository without errors', function() {
			scm = createScm({
				type: type,
				repository: path.join(__dirname, 'repos', type)
			});
		});

		var currentRev = data[0].id;
		it('clone rev0 to dst without errors', function(done) {
			scm.clone(repositoryPath, data[0].id, done);
		});

		it('expect scm.cwd equals to dst', function() {
			expect(scm.cwd).equal(repositoryPath);
		});

		it('expect current revision equals to rev0', function(done) {
			scm.getCurrent(function(err, rev) {
				if (err) return done(err);
				expect(rev).eql(data[0]);
				done();
			});
		});

		it('expect rev0 info is good', function(done) {
			scm.getRev(mercurialRevs[0].id, function(err, rev) {
				if (err) return done(err);
				expect(rev).eql(mercurialRevs[0]);
				done();
			});
		});

		it('expect none changes from rev0 to default revision', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(0);
				done();
			});
		});

		it('pull to default revision without errors', function(done) {
			scm.pull(scm.defaultRev, done);
		});

		it('now (after pull) expect rev1 and rev2 as new changes (in reverse ' +
			'order) from rev0 to default revision', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(2);
				expect(changes).eql([data[2], data[1]]);
				done();
			});
		});

		it('update to default revision (should update to rev2) without error',
			function(done) {
				scm.update(scm.defaultRev, done);
			});

		it('expect current revision equals to rev2', function(done) {
			scm.getCurrent(function(err, rev) {
				if (err) return done(err);
				expect(rev).eql(data[2]);
				done();
			});
		});

		it('create scm instance attached to existing `cwd` without errors', function() {
			scm = createScm({type: type, cwd: repositoryPath});
		});

		it('expect repository log from rev0 to default revision equals to ' +
			'rev1 and rev2 (in reverse order)', function(done) {
			scm.getChanges(data[0].id, scm.defaultRev, function(err, changes) {
				if (err) return done(err);
				expect(changes).ok();
				expect(changes).length(2);
				expect(changes).eql([data[2], data[1]]);
				done();
			});
		});

		it('remove test repository dir', function(done) {
			rmdir(repositoryPath, done);
		});
	});
});


function getTestData(type) {
	if (type === 'mercurial') return mercurialRevs;
}
