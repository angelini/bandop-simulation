var C = {
  api: 'http://localhost:8080/api',
  app: 'http://localhost:8010/app.html',
  server: 'http://localhost:8080/',
};

var Design = function(id, reward, div) {
  this.id = id;
  this.reward = reward;
  this.div = div;
};

Design.prototype.update = function() {
  var self = this;

  reqwest({
    url: C.api + '/designs/' + this.id,
    type: 'json',
    withCredentials: true,
    success: function(resp) {
      self.draw(resp.stats, resp.screenshot);
    }
  });
};

Design.prototype.draw = function(stats, screenshot) {
  var img = this.div.querySelector('img'),
      count = this.div.querySelector('.count'),
      prob = this.div.querySelector('.prob');

  img.src = C.server + screenshot;
  count.innerText = stats.count;
  prob.innerText = stats.prob;
};

Design.prototype.inc = function() {
  reqwest({
    url: C.api + '/rewards/' + this.id,
    method: 'post',
    type: 'json',
    data: JSON.stringify({value: this.reward}),
    contentType: 'application/json',
    crossOrigin: true
  });
};

var Client = function(rate, iframe) {
  this.rate = rate;
  this.iframe = iframe;
};

_.extend(Client.prototype, Backbone.Events);

Client.prototype.fetch = function(cb) {
  this.iframe.onload = function() {
    var link = this.contentDocument.getElementsByTagName('link')[0];
    cb(parseInt(_.last(link.href.split('/')), 10));
  };

  this.iframe.src = C.app;
};

Client.prototype.start = function() {
  var self = this;

  this.fetch(function(design) {
    self.trigger('design', design);
    setTimeout(self.start.bind(self), (60 / self.rate) * 1000);
  });
};

var Simulation = {
  login: function(email, password, cb) {
    reqwest({
      url: C.api + '/auth/login',
      method: 'post',
      data: JSON.stringify({email: email, password: password}),
      contentType: 'application/json',
      success: function(resp) {
        document.cookie = '_bandop_login=' + resp.key;
        cb();
      }
    });
  },

  init: function(designs, clients) {
    _.each(clients, function(client) {
      client.on('design', function(design) {
        Simulation.reward(design, designs);
      });

      client.start();
    });

    setInterval(function() {
      _.each(designs, function(design) {
        design.update();
      });
    }, 5000);
  },

  reward: function(id, designs) {
    var design = _.find(designs, function(design) { return design.id == id; });
    design.inc();
  }
};
