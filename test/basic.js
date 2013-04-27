var test = require('tap').test;
var parser = require('../index.js');

test('ruleHead event', function (t) {
    var src = 'rule $\n sampleRule\n';
    var p = parser();
    p.on('ruleHead', function (name) {
        t.equal(name, 'sampleRule',
                '\'ruleHead\' event should have rule name.');
        t.end();
    });
    p.end(src);
});


test('\'binding\' event', function (t) {
    function check(src, expectedKey, expectedValue) {
        var p = parser();
        p.on('binding', function (key, value) {
            t.equal(key, expectedKey);
            t.deepEqual(value, expectedValue);
        });
        p.end(src);
    }
    check('  varName = val\n', 'varName', ['val']);
    check('  vn = $foo ${bar}\n', 'vn',
          [{varName: 'foo'}, ' ', {varName: 'bar'}]);
    check('  vn = $foo ${bar}.d\n', 'vn',
          [{varName: 'foo'}, ' ', {varName: 'bar'}, '.d']);
    check('  vn = ${foo}$ $:$$\n', 'vn',
          [{varName: 'foo'}, ' :$']);
    t.end();
});

test('finish parsing on end', function (t) {
    t.plan(1);
    var src = 'rule noTerminatingNewline';
    var p = parser();
    p.on('ruleHead', function (name) {
        t.pass('\'ruleHead\' event was emitted');
    });
    p.end(src);
});

test('basic rule parsing', function (t) {
    var src =
        'rule cxx\n' +
        '  command = $cxx $cxxflags -MMD -MT $out -MF $out.d -o $out -c $in\n' +
        '  description = CXX $in\n' +
        '  depfile = $out.d\n';

    var p = parser();
    var rule = null;
    p.on('ruleHead', function (name) {
        t.equal(rule, null, '\'ruleHead\' should be first event');
        rule = {
            name: name,
            bindings: []
        };
    });
    var count = 0;
    p.on('binding', function (key, value) {
        rule.bindings.push({
            key: key,
            value: value
        });
        count += 1;
        t.equal(rule.bindings.length, count);
        if (count === 3) {
            t.end();
        }
    });
    // Ensure that buffering is happening correctly.
    src.split('').forEach(function (e) {
        p.write(e);
    });
    p.end();
});
