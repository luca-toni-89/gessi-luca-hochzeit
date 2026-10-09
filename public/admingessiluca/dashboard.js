(function () {
  "use strict";

  var rsvps = [];
  var allRows = [];
  var loaded = false;
  var rowsElement = document.getElementById("guestRows");
  var emptyElement = document.getElementById("emptyMessage");
  var errorElement = document.getElementById("errorMessage");
  var countElement = document.getElementById("resultCount");
  var searchElement = document.getElementById("searchInput");
  var filterElement = document.getElementById("statusFilter");
  var reloadButton = document.getElementById("reloadButton");
  var exportButton = document.getElementById("exportButton");

  function byId(id) { return document.getElementById(id); }

  function formatDate(value) {
    if (!value) return "";
    var iso = String(value).replace(" ", "T");
    if (!/(Z|[+-][0-9]{2}:[0-9]{2})$/i.test(iso)) iso += "Z";
    var date = new Date(iso);
    if (isNaN(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat("de-CH", {
        timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit",
        year: "numeric", hour: "2-digit", minute: "2-digit"
      }).format(date);
    } catch (error) {
      return String(value);
    }
  }

  function flatten(items) {
    var flat = [];
    items.forEach(function (rsvp) {
      var base = {
        attending: !!rsvp.attending,
        contactName: String(rsvp.contactName || ""),
        createdAt: formatDate(rsvp.createdAt),
        language: rsvp.language === "it" ? "Italienisch" : "Deutsch"
      };
      if (base.attending && Array.isArray(rsvp.guests) && rsvp.guests.length) {
        rsvp.guests.forEach(function (guest) {
          flat.push({
            attending: true,
            firstName: String(guest.firstName || ""),
            lastName: String(guest.lastName || ""),
            name: [guest.firstName, guest.lastName].filter(Boolean).join(" "),
            dietary: String(guest.dietaryRequirements || ""),
            contactName: base.contactName,
            createdAt: base.createdAt,
            language: base.language
          });
        });
      } else {
        flat.push({
          attending: base.attending,
          firstName: "",
          lastName: "",
          name: base.contactName,
          dietary: "",
          contactName: base.contactName,
          createdAt: base.createdAt,
          language: base.language
        });
      }
    });
    return flat;
  }

  function makeCell(value, className) {
    var cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = value || "–";
    return cell;
  }

  function renderRows() {
    var search = String(searchElement.value || "").trim().toLocaleLowerCase("de");
    var status = filterElement.value;
    var visible = allRows.filter(function (item) {
      if (status === "yes" && !item.attending) return false;
      if (status === "no" && item.attending) return false;
      return !search || [item.name, item.dietary, item.contactName].join(" ").toLocaleLowerCase("de").indexOf(search) !== -1;
    });

    var fragment = document.createDocumentFragment();
    visible.forEach(function (item) {
      var tr = document.createElement("tr");
      var nameTd = document.createElement("td");
      var nameCell = document.createElement("div");
      nameCell.className = "name-cell";
      var avatar = document.createElement("span");
      avatar.className = "avatar" + (item.attending ? "" : " is-absent");
      avatar.setAttribute("aria-hidden", "true");
      var words = String(item.name || "").trim().split(/\s+/);
      avatar.textContent = words.filter(Boolean).slice(0, 2).map(function (word) {
        return word.charAt(0).toLocaleUpperCase("de");
      }).join("") || "♡";
      var nameText = document.createElement("span");
      nameText.className = "name-label";
      nameText.textContent = item.name || "–";
      nameCell.appendChild(avatar);
      nameCell.appendChild(nameText);
      nameTd.appendChild(nameCell);
      tr.appendChild(nameTd);
      var statusTd = document.createElement("td");
      var marker = document.createElement("span");
      marker.className = "status" + (item.attending ? "" : " no");
      marker.textContent = item.attending ? "Zusage" : "Absage";
      statusTd.appendChild(marker);
      tr.appendChild(statusTd);
      tr.appendChild(makeCell(item.dietary, "diet" + (item.dietary.trim() ? " has-diet" : "")));
      tr.appendChild(makeCell(item.createdAt, "muted"));
      tr.appendChild(makeCell(item.contactName, "muted"));
      fragment.appendChild(tr);
    });
    rowsElement.replaceChildren(fragment);
    countElement.textContent = visible.length + " von " + allRows.length + " Einträgen";
    emptyElement.textContent = loaded && allRows.length === 0
      ? "Noch keine Anmeldungen eingegangen."
      : loaded ? "Keine passenden Einträge gefunden." : "Anmeldungen werden geladen …";
    emptyElement.hidden = visible.length > 0;
  }

  function updateSummary() {
    var confirmed = rsvps.reduce(function (total, response) {
      return total + (response.attending ? (response.guests || []).length : 0);
    }, 0);
    var declined = rsvps.filter(function (response) { return !response.attending; }).length;
    var dietary = rsvps.reduce(function (total, response) {
      return total + (response.attending ? (response.guests || []).filter(function (guest) {
        return String(guest.dietaryRequirements || "").trim().length > 0;
      }).length : 0);
    }, 0);
    byId("countYes").textContent = String(confirmed);
    byId("countNo").textContent = String(declined);
    byId("countDiet").textContent = String(dietary);
    byId("countRsvps").textContent = String(rsvps.length);
    return { confirmed: confirmed, declined: declined, dietary: dietary, responses: rsvps.length };
  }

  async function load() {
    reloadButton.disabled = true;
    exportButton.disabled = true;
    errorElement.hidden = true;
    countElement.textContent = "Daten werden geladen …";
    try {
      var response = await fetch("/admingessiluca/data", {
        method: "GET", cache: "no-store", credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      if (!data || !Array.isArray(data.rsvps)) throw new Error("Ungültige Antwort");
      rsvps = data.rsvps;
      allRows = flatten(rsvps);
      loaded = true;
      updateSummary();
      renderRows();
      exportButton.disabled = false;
    } catch (error) {
      loaded = false;
      allRows = [];
      renderRows();
      countElement.textContent = "Daten konnten nicht geladen werden";
      emptyElement.textContent = "Bitte versuche es erneut.";
      errorElement.textContent = "Die Gästeliste konnte nicht abgerufen werden. Bitte prüfe die D1-Datenbankverbindung und versuche es erneut.";
      errorElement.hidden = false;
      console.error("Wedding admin fetch failed", error);
    } finally {
      reloadButton.disabled = false;
    }
  }

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function columnName(number) {
    var name = "";
    for (var n = number; n > 0; n = Math.floor((n - 1) / 26)) {
      name = String.fromCharCode(65 + (n - 1) % 26) + name;
    }
    return name;
  }

  function worksheet(data, widths, filter) {
    var last = columnName(data[0].length) + String(Math.max(1, data.length));
    var columns = widths.map(function (width, index) {
      return '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>';
    }).join("");
    var body = data.map(function (values, rowNumber) {
      var cells = values.map(function (value, index) {
        var ref = columnName(index + 1) + (rowNumber + 1);
        var style = rowNumber === 0 ? ' s="1"' : "";
        if (typeof value === "number" && Number.isFinite(value)) {
          return '<c r="' + ref + '"' + style + '><v>' + value + '</v></c>';
        }
        return '<c r="' + ref + '" t="inlineStr"' + style + '><is><t xml:space="preserve">' +
          xmlEscape(value) + '</t></is></c>';
      }).join("");
      return '<row r="' + (rowNumber + 1) + '">' + cells + '</row>';
    }).join("");
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<dimension ref="A1:' + last + '"/>' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="16"/><cols>' + columns + '</cols><sheetData>' + body + '</sheetData>' +
      (filter ? '<autoFilter ref="A1:' + last + '"/>' : "") + '</worksheet>';
  }

  function makeWorkbook(summary) {
    var guestData = [[
      "Status", "Vorname", "Nachname", "Name", "Kontaktperson",
      "Allergien / Unverträglichkeiten", "Angemeldet am", "Sprache"
    ]];
    allRows.forEach(function (item) {
      guestData.push([
        item.attending ? "Zusage" : "Absage",
        item.firstName, item.lastName, item.name, item.contactName,
        item.dietary, item.createdAt, item.language
      ]);
    });
    var overviewData = [
      ["Kategorie", "Anzahl"],
      ["Zugesagte Gäste", summary.confirmed],
      ["Absagen (Anmeldungen)", summary.declined],
      ["Gäste mit Unverträglichkeiten", summary.dietary],
      ["Rückmeldungen gesamt", summary.responses]
    ];
    var files = [
      { name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>' },
      { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { name: "xl/workbook.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Gaesteliste" sheetId="1" r:id="rId1"/><sheet name="Uebersicht" sheetId="2" r:id="rId2"/></sheets></workbook>' },
      { name: "xl/_rels/workbook.xml.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>' },
      { name: "xl/styles.xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FF264D36"/><name val="Aptos"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFE9F1EA"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
      { name: "xl/worksheets/sheet1.xml", data: worksheet(guestData, [15, 19, 23, 31, 30, 45, 23, 16], true) },
      { name: "xl/worksheets/sheet2.xml", data: worksheet(overviewData, [36, 16], false) }
    ];
    return zipStore(files);
  }

  function crc32(bytes) {
    if (!crc32.table) {
      var table = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var value = n;
        for (var k = 0; k < 8; k++) value = value & 1 ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
        table[n] = value >>> 0;
      }
      crc32.table = table;
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = crc32.table[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function put16(bytes, at, value) {
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint16(at, value, true);
  }
  function put32(bytes, at, value) {
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(at, value, true);
  }
  function joinBytes(parts) {
    var length = parts.reduce(function (sum, part) { return sum + part.length; }, 0);
    var result = new Uint8Array(length);
    var offset = 0;
    parts.forEach(function (part) { result.set(part, offset); offset += part.length; });
    return result;
  }
  function zipStore(files) {
    var encoder = new TextEncoder();
    var locals = [];
    var centrals = [];
    var offset = 0;
    var centralSize = 0;
    files.forEach(function (file) {
      var filename = encoder.encode(file.name);
      var data = encoder.encode(file.data);
      var checksum = crc32(data);
      var local = new Uint8Array(30);
      put32(local, 0, 0x04034B50);
      put16(local, 4, 20);
      put16(local, 6, 0x0800);
      put32(local, 14, checksum);
      put32(local, 18, data.length);
      put32(local, 22, data.length);
      put16(local, 26, filename.length);
      locals.push(local, filename, data);

      var central = new Uint8Array(46);
      put32(central, 0, 0x02014B50);
      put16(central, 4, 20);
      put16(central, 6, 20);
      put16(central, 8, 0x0800);
      put32(central, 16, checksum);
      put32(central, 20, data.length);
      put32(central, 24, data.length);
      put16(central, 28, filename.length);
      put32(central, 42, offset);
      centrals.push(central, filename);
      centralSize += central.length + filename.length;
      offset += local.length + filename.length + data.length;
    });
    var end = new Uint8Array(22);
    put32(end, 0, 0x06054B50);
    put16(end, 8, files.length);
    put16(end, 10, files.length);
    put32(end, 12, centralSize);
    put32(end, 16, offset);
    return joinBytes(locals.concat(centrals, [end]));
  }

  function downloadExcel() {
    if (!loaded) return;
    try {
      var bytes = makeWorkbook(updateSummary());
      var blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      var today = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
      link.download = "Gaesteliste_Gessica_Luca_" + today + ".xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    } catch (error) {
      errorElement.textContent = "Der Excel-Export konnte nicht erstellt werden. Bitte versuche es erneut.";
      errorElement.hidden = false;
      console.error("Wedding XLSX export failed", error);
    }
  }

  searchElement.addEventListener("input", renderRows);
  filterElement.addEventListener("change", renderRows);
  reloadButton.addEventListener("click", load);
  exportButton.addEventListener("click", downloadExcel);
  load();
}());