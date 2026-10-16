// Embedded editors contain no advertising or portal navigation.
if (new URLSearchParams(location.search).get('embed') === '1') {
  document.querySelector('#blogLink')?.remove();
}
