var C = {
  api: 'http://localhost:8080/api',
  app: 'http://localhost:8010/app.html'
};

var Design = function(id, reward) {
  this.id = id;
  this.reward = reward;
};

Design.prototype.update = function() {
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
  init: function(designs, clients) {
    _.each(clients, function(client) {
      client.on('design', function(design) {
        Simulation.reward(design, designs);
      });

      client.start();
    });
  },

  reward: function(id, designs) {
    var design = _.find(designs, function(design) { return design.id == id; });
    design.update();
  }
};
