var SwaggerParser = require('swagger-parser')
var DocumentBuilder = require('abstract-document-builder')
var MarkdownWriter = require('markdown-writer')
var ConfluenceWriter = require('confluence-writer')
var each = require('util-each')

module.exports = convert

var format = {
  confluence: ConfluenceWriter,
  markdown: MarkdownWriter
}

function yes (b) {
  return b ? 'yes' : ''
}

function refname (ref) {
  return ref.replace(/.*\/([^\/])/, '$1')
}

function convert (path, frmt) {
  var Writer = format[frmt]
  var s = new Writer()
  var md = new DocumentBuilder(s)
  var parser = new SwaggerParser()

  function schemaOrType (info) {
    if (info.schema) {
      if (info.schema.type) {
        return info.schema.type
      }
      return md._link(refname(info.schema.$ref))
    }
    return info.type
  }

  parser.bundle(path, function (err, api) {
    if (err) {
      s.emit('error', err)
      return
    }

    md.header(1, api.info.title)
    md.text(api.info.description + '\n\n')

    md.tableHeader()
    md.tableHeaderRow('Specification', 'Value')
    md.tableRow('API Version', api.info.version)
    md.tableFooter()

    md.header(2, 'Operations')
    md.tableHeader()
    md.tableHeaderRow('Resource Path', 'Operation', 'Description')
    each(api.paths, function (resource, rpath) {
      each(resource, function (info, method) {
        md.tableRow(rpath, md._link([rpath, method].join('-'), method), info.summary)
      })
    })
    md.tableFooter()

    each(api.paths, function (resource, rpath) {
      each(resource, function (info, method) {
        md.anchor([rpath, method].join('-'))
        md.header(3, rpath + ' (' + method + ')')
        md.text(info.description)

        if (info.parameters && info.parameters.length > 0) {
          md.header(4, 'Parameters')
          md.tableHeader()
          md.tableHeaderRow('Param Name', 'Param Type', 'Data Type', 'Description', 'Required?')
          each(info.parameters, function (param) {
            md.tableRow(param.name, param.in, schemaOrType(param), param.description, yes(param.required))
          })
          md.tableFooter()
        }

        if (info.responses) {
          md.header(4, 'Responses')
          md.tableHeader()
          md.tableHeaderRow('Code', 'Type', 'Description')
          each(info.responses, function (resp, code) {
            md.tableRow(code, schemaOrType(resp), resp.description)
          })
          md.tableFooter()
        }
      })
    })

    md.header(2, 'Definitions')
    each(api.definitions, function (def, name) {
      var r = def.required || []
      md.anchor(name)
      md.header(3, name)
      md.tableHeader()
      md.tableHeaderRow('Field Name', 'Field Type', 'Description', 'Required?', 'Read Only?')
      each(def.properties, function (pi, pn) {
        md.tableRow(pn, pi.type, pi.description, yes(~r.indexOf(pn)), yes(pi.readOnly))
        if (pi.items && pi.items.$ref) {
          md.tableRow(' - Item', md._link(refname(pi.items.$ref)), '', '', '')
        }
      })
    })
  })

  return s
}
