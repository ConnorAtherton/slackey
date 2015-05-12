'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire');

var SlackAPIClient;
var slackAPIClient;
var requestStub;

describe('SlackAPIClient', function() {


  beforeEach(function() {
    requestStub = this.sinon.stub();
    SlackAPIClient = proxyquire('../../lib/api-client.js', {
      'request': requestStub
    });
    slackAPIClient = new SlackAPIClient({
      token: 'XXX',
      apiURL: 'YYY',
    });
  });

  describe('constructor', function() {

    it('should return a SlackAPIClient object when called', function() {
      var createdSlackAPIClient = new SlackAPIClient();
      assert.ok(createdSlackAPIClient instanceof SlackAPIClient);
    });

    it('should set the provided options when called with options', function() {
      var createdSlackAPIClient = new SlackAPIClient({
        token: 'XXX',
        apiURL: 'YYY',
      });
      assert.equal(createdSlackAPIClient.token, 'XXX');
      assert.equal(createdSlackAPIClient.apiURL, 'YYY');
    });

  });

  describe('.makeRequest()', function() {

    var requestOptions = {foo: 'bar'};

    it('should pass options argument to the request function when called', function() {
      slackAPIClient.makeRequest(requestOptions);
      assert(requestStub.called);
      assert(requestStub.calledWith(requestOptions));
    });

    it('should propagate any request error to the callback', function(done) {
      var requestError = new Error('[TEST] request() error');
      requestStub.yields(requestError);
      slackAPIClient.makeRequest(requestOptions, function(err, body, response) {
        assert.equal(err, requestError);
        assert.equal(body, undefined);
        assert.equal(response, undefined);
        done();
      });
    });

    it('should return the response body and response object to the callback in that order', function(done) {
      var responseObj = {response: true};
      var responseBody = {body: true};
      requestStub.yields(null, responseObj, responseBody);
      slackAPIClient.makeRequest(requestOptions, function(err, body, response) {
        assert.equal(err, null);
        assert.equal(body, responseBody);
        assert.equal(response, responseObj);
        done();
      });
    });

  });

  describe('.api()', function() {

    var makeRequestStub;

    beforeEach(function() {
      makeRequestStub = this.sinon.stub(slackAPIClient, 'makeRequest');
    });

    it('should create the URL from the apiURL property and the method argument when called', function() {
      slackAPIClient.api('TEST_METHOD');
      assert(makeRequestStub.called);
      assert(makeRequestStub.calledWithMatch({url: 'YYYTEST_METHOD'}));
    });

    it('should still call the provided callback when no options argument is provided', function(done) {
      makeRequestStub.yields();
      slackAPIClient.api('TEST_METHOD', done);
    });

    it('should always set the correct default request arguments when called', function() {
      slackAPIClient.api('TEST_METHOD');
      assert(makeRequestStub.calledWithMatch({json: true, method: 'GET'}));
    });

    it('should append the token to the query string when called', function() {
      slackAPIClient.api('TEST_METHOD');
      assert(makeRequestStub.calledWithMatch({qs: {token: 'XXX'}}));
    });

    it('should pass the provided options as query params via GET when called on a normal method', function() {
      var methodOptions = {foo: 'bar'};
      slackAPIClient.api('TEST_METHOD', methodOptions);
      assert(makeRequestStub.calledWithMatch({qs: {foo: 'bar', token: 'XXX'}}));
    });


    it('should POST when called with "files.upload" method', function() {
      slackAPIClient.api('files.upload');
      assert(makeRequestStub.calledWithMatch({method: 'POST'}));
    });

    it('should attach the file option as form-upload data when called with "file.upload" method', function() {
      var fileData = new Buffer(123);
      var methodOptions = {file: fileData};
      slackAPIClient.api('files.upload', methodOptions);
      assert(makeRequestStub.calledWithMatch({formData: {file: fileData}}));
    });


    it('should attach the content option as form body data when called with "file.upload" method', function() {
      var contentData = 'TEST_UPLOAD_CONTENT';
      var methodOptions = {content: contentData};
      slackAPIClient.api('files.upload', methodOptions);
      assert(makeRequestStub.calledWithMatch({form: {content: contentData}}));
    });

  });

});