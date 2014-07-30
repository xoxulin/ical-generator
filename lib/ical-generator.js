var a = {
	newCalendar: function() {
		'use strict';

		var cal = {
			domain: null,
			prodid: '//sebbo.net//ical-generator//EN',

			generated: null,
			events: [],

			methods: {
				setDomain: function(domain) {
					cal.domain = domain.toString();
					return cal.methods;
				},
				setProdID: function(id) {
					if(!id || typeof id !== 'object') {
						throw 'prodid is not an object.';
					}
					if(!id.company) {
						throw 'prodid.company is a mandatory item.';
					}
					if(!id.product) {
						throw 'prodid.product is a mandatory item.';
					}
					id.language = (id.language || 'EN').toUpperCase();

					cal.prodid = '//' + id.company + '//' + id.product + '//' + id.language;
					return cal.methods;
				},
				setName: function(name) {
					cal.name = name.toString();
					return cal.methods;
				},
				addEvent: function(e) {
					var _event = {};

					if(!e || typeof e !== 'object') {
						throw 'event is not an object.';
					}

					// UID
					_event.uid = e.uid || ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);

					// Date Start
					if(!e.start) {
						throw 'event.start is a mandatory item.';
					}
					if(Object.prototype.toString.call(e.start) !== '[object Date]') {
						throw 'event.start must be a Date Object.';
					}
					_event.start = e.start;

					// Date Stop
					if(!e.end) {
						throw 'event.end is a mandatory item.';
					}
					if(Object.prototype.toString.call(e.end) !== '[object Date]') {
						throw 'event.end must be a Date Object.';
					}
					_event.end = e.end;

					// allDay flag
					_event.allDay = e.allDay ? true : false;

					// Date Stamp
					if(e.stamp && Object.prototype.toString.call(e.stamp) !== '[object Date]') {
						throw 'event.stamp must be a Date Object.';
					}
					_event.stamp = e.stamp || new Date();

					// Summary
					if(!e.summary) {
						throw 'event.summary is a mandatory item.';
					}
					_event.summary = e.summary;

					// Location
					_event.location = e.location || null;

					// Description
					_event.description = e.description || null;

					// Organizer
					_event.organizer = null;
					if(e.organizer && typeof e.organizer === 'object') {
						if(!e.organizer.name) {
							throw 'event.organizer.name is empty.';
						}
						if(!e.organizer.email) {
							throw 'event.organizer.email is empty.';
						}

						_event.organizer = {
							name: e.organizer.name,
							email: e.organizer.email
						};
					}

					// URL
					_event.url = e.url || null;

          _event.reminders = e.reminders || null;

					cal.generated = null;
					cal.events.push(_event);
					return cal.methods;
				},
				generate: function() {
					var g;

					function _formatDate(d, dateonly) {
						var s;

						function pad(i) {
							return (i < 10 ? '0': '') + i;
						}

						s = d.getUTCFullYear();
						s += pad(d.getUTCMonth() + 1);
						s += pad(d.getUTCDate());

						if(!dateonly) {
							s += 'T';
							s += pad(d.getUTCHours());
							s += pad(d.getUTCMinutes());
							s += pad(d.getUTCSeconds());
						}

						s += 'Z';
						return s;
					}

					function _escape(str) {
						return str.replace(/[\\;,\n]/g, function (match) {
							if (match === '\n') {
								return '\\n';
							}

							return '\\' + match;
						});
					}

					function _getUID(e) {
						return _formatDate(e.start) + '-' + e.uid + '@' + cal.domain;
					}

          function formatDuration(minutes) {

            if (minutes === 0) return 'PT0S';

            var res = '';

            if (minutes < 0) {res += '-'; minutes = -minutes;}
            minutes == ~~(minutes);
            res += 'P';

            if (minutes > 10080) {res += ~~(minutes/10080) + 'W'; minutes = minutes % 10080;}
            if (minutes > 1440) {res += ~~(minutes/1440) + 'D'; minutes = minutes % 1440;}
            if (minutes > 0) {res += 'T';}
            if (minutes > 60) {res += ~~(minutes/60) + 'H'; minutes = minutes % 60;}
            if (minutes > 0) {res += minutes + 'M';}

            return res;
          }

					// VCALENDAR and VERSION
					g = 'BEGIN:VCALENDAR\nVERSION:2.0\n';

					// PRODID
					g += 'PRODID:-' + cal.prodid + '\n';

					// NAME
					if (cal.name) {
						g += 'X-WR-CALNAME:' + cal.name + '\n';
					}

					// Domain
					if(!cal.domain) {
						cal.domain = require('os').hostname() || 'localhost';
					}

					// Events
					cal.events.forEach(function(e) {
						g += 'BEGIN:VEVENT\n';
						g += 'UID:' + _getUID(e) + '\n';
						g += 'DTSTAMP:' + _formatDate(e.stamp) + '\n';

						if(e.allDay) {
							g += 'DTSTART;VALUE=DATE:' + _formatDate(e.start, true) + '\n';
							g += 'DTEND;VALUE=DATE:' + _formatDate(e.end, true) + '\n';
						}else{
							g += 'DTSTART:' + _formatDate(e.start) + '\n';
							g += 'DTEND:' + _formatDate(e.end) + '\n';
						}

						if(e.summary) {
							g += 'SUMMARY:' + _escape(e.summary) + '\n';
						}
						if(e.location) {
							g += 'LOCATION:' + _escape(e.location) + '\n';
						}
						if(e.description) {
							g += 'DESCRIPTION:' + _escape(e.description )+ '\n';
						}
						if(e.organizer) {
							g += 'ORGANIZER;CN="' + e.organizer.name.replace(/\"/g, '\\"') + '":mailto:' + e.organizer.email + '\n';
						}
						if(e.url) {
							g += 'URL;VALUE=URI:' + e.url + '\n';
						}

            if (e.reminders != null && e.reminders.constructor === Array) {
              e.reminders.forEach(function(min) {
                g += 'BEGIN:VALARM\n';
                g += 'TRIGGER:' + formatDuration(-min) + '\n';
                g += 'ACTION:DISPLAY\n';
                g += 'END:VALARM\n';
              });
						}

						g += 'END:VEVENT\n';
					});

					g += 'END:VCALENDAR';
					cal.generated = g;

					return cal.methods;
				},
				save: function(path, cb) {
					if(!cal.generated) {
						cal.methods.generate();
					}
					require('fs').writeFile(path, cal.generated, cb || function(){});
					return cal.methods;
				},
				saveSync: function(path) {
					if(!cal.generated) {
						cal.methods.generate();
					}

					/*jslint stupid: true */
					return require('fs').writeFileSync(path, cal.generated);
				},
				serve: function(res) {
					if(!cal.generated) {
						cal.methods.generate();
					}

					res.writeHead(200, {
						'Content-Type': 'text/calendar',
						'Content-Disposition': 'attachment; filename="calendar.ics"'
					});
					res.end(cal.generated);
					return cal.methods;
				},
				toString: function() {
					if(!cal.generated) {
						cal.methods.generate();
					}
					return cal.generated;
				},
				length: function() {
					return cal.events.length;
				},
				clear: function() {
					cal.events = [];
					cal.generated = null;
					return cal.methods;
				}
			}
		};

		return cal.methods;
	}
};

module.exports = a.newCalendar;
