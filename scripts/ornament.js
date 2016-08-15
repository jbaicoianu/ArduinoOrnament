elation.require(['ui.slider', 'ui.select'], function() {
  elation.requireCSS('ornament.ornament');

  elation.component.add("ornament.controller", function() {
    this.init = function() {
      this.addclass('ornament_controller');
      this.modeselect = elation.ui.select({
        append: this,
        label: 'Mode',
        items: ['fire', 'rainbow', 'pulse red', 'pulse green', 'pulse blue'],
        events: {
          ui_select_change: elation.bind(this, this.handlemodechange)
        }
      });
      this.frequencyslider = elation.ui.slider({
        append: this,
        name: 'frequency',
        min: 0.01,
        max: 20,
        handles: [
          {
            "name":"speed",
            "bounds":"max",
            "input":"true",
            "anchor":"left",
            "labelprefix":"frequency: ",
            "labelsuffix":"Hz",
            "value":"1",
            "snap":"0.01",
            "toFixed":"2"
          },
        ],
        events: {
          ui_slider_change: elation.bind(this, this.handlefrequencychange)
        }
      });
      this.pixels = [
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
/*
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this}),
        elation.ornament.pixel({append: this})
*/
      ];

      this.cyclers = {
        'rainbow'    : elation.ornament.cycler.rainbow({pixels: this.pixels}),
        'fire'       : elation.ornament.cycler.fire({pixels: this.pixels}),
        'pulse red'  : elation.ornament.cycler.redpulse({pixels: this.pixels}),
        'pulse green': elation.ornament.cycler.greenpulse({pixels: this.pixels}),
        'pulse blue' : elation.ornament.cycler.bluepulse({pixels: this.pixels}),
      };
      this.cycler = this.cyclers['fire'];
console.log(this.cycler);

      this.cyclespeed = 1000;

      this.accesstoken = '324bb1867df70219c4c01a18239ce86a7e28b000';

      this.refresh();
    }
    this.render = function() {
      var now = new Date().getTime();
/*
      for (var i = 0; i < this.pixels.length; i++) {
        this.pixels[i].cycle(now + (i * (this.cyclespeed * this.pixels.length)));
      }
*/
      this.cycler.cycle(now);
      setTimeout(elation.bind(this, this.refresh), 0);
      //this.refresh();
    }
    this.handlefrequencychange = function(ev) {
      if (!this.changetimer) {
        this.changetimer = setTimeout(elation.bind(this, this.submit), 250);
      }
      this.cyclespeed = 1000 / this.frequencyslider.value;
      for (var k in this.cyclers) {
        this.cyclers[k].cyclespeed = this.cyclespeed;
      }

    }
    this.handlemodechange = function(ev) {
console.log('change mode!', this.modeselect.value);
      elation.net.post("https://api.spark.io/v1/devices/55ff6b065075555312200487/toggletype?access_token=" + this.accesstoken, {args: this.modeselect.value});
      this.cycler = this.cyclers[this.modeselect.value];
    }

    this.submit = function() {
      this.changetimer = false;
      var formdata = {
        args: 1000 / this.frequencyslider.value
      };
console.log('submit:', formdata);
      elation.net.post("https://api.spark.io/v1/devices/55ff6b065075555312200487/setspeed?access_token=" + this.accesstoken, formdata);
    }

    this.login = function() {
      sparkLogin(elation.bind(this, this.handlelogin));
    }
    this.handlelogin = function(d) {
      console.log('login happened:', d);
      if (d && d.access_token) {
        this.accesstoken = d.access_token;
      }
    }
  }, elation.ui.base);

  elation.component.add('ornament.pixel', function() {
    this.defaultcontainer = { tag: 'div', classname: 'ornament_pixel' };

    this.init = function() {
      this.r = 0;
      this.g = 0;
      this.b = 0;

      this.active = true;
    }
    this.render = function() {
      this.container.style.backgroundColor = this.gethex();
    }
    this.gethex = function() {
      return '#' + this.gethexcomponent(this.r) + this.gethexcomponent(this.g) + this.gethexcomponent(this.b);
    }
    this.gethexcomponent = function(c) {
      return (c < 16 ? '0' : '') + c.toString(16);
    }
    this.setRGB = function(rgb) {
      this.r = rgb.r;
      this.g = rgb.g;
      this.b = rgb.b;
      this.refresh();
    }
  }, elation.ui.base);

  elation.component.add('ornament.cycler.base', function() {
    this.init = function() {
      this.pixels = this.args.pixels || [];
      this.cyclespeed = 1000;
    }
    this.cycle = function(now) {
      for (var i = 0; i < this.pixels.length; i++) {
        this.pixels[i].setRGB(this.getvalue(now + (i * (this.cyclespeed * (this.pixels.length / 2)))));
      }
    }
    this.getvalue = function(t) {
      return {
        r: 0,
        g: 0,
        b: 0
      };
    }
    this.conv = function(t) {
      return Math.round(128 * (Math.sin(Math.PI * t) + 1));
    }
  });
  elation.component.add('ornament.cycler.rainbow', function() {
    this.getvalue = function(t) {
      return {
        r: this.conv(t / this.cyclespeed / 4),
        g: this.conv(t / this.cyclespeed / 2),
        b: this.conv(t / this.cyclespeed)
      };
    }
  }, elation.ornament.cycler.base);
  elation.component.add('ornament.cycler.fire', function() {
    this.getvalue = function(t) {
      return {
        r: 255,
        g: this.conv(t / this.cyclespeed),
        b: 0
      };
    }
  }, elation.ornament.cycler.base);
  elation.component.add('ornament.cycler.pulse', function() {
/*
    this.cycle = function(now) {
      for (var i = 0; i < this.pixels.length; i++) {
        this.pixels[i].setRGB(this.getvalue(now));
      }
    }
*/
  }, elation.ornament.cycler.base);
  elation.component.add('ornament.cycler.redpulse', function() {
    this.getvalue = function(t) {
      return {
        r: this.conv(t / this.cyclespeed),
        g: 0,
        b: 0
      };
    }
  }, elation.ornament.cycler.pulse);
  elation.component.add('ornament.cycler.greenpulse', function() {
    this.getvalue = function(t) {
      return {
        r: 0,
        g: this.conv(t / this.cyclespeed),
        b: 0
      };
    }
  }, elation.ornament.cycler.pulse);
  elation.component.add('ornament.cycler.bluepulse', function() {
    this.getvalue = function(t) {
      return {
        r: 0,
        g: 0,
        b: this.conv(t / this.cyclespeed)
      };
    }
  }, elation.ornament.cycler.pulse);
});
