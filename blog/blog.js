const code = document.querySelector('#embedCode');
if (code) {
  const tool = document.querySelector('#embedTool');
  const tools = {
    brindes: { url: '../index.html?embed=1', title: 'Simulador de brindes Elo Preview', preview: 'simulador.html' },
    canetas: { url: 'https://rodneyberthault27-lgtm.github.io/mockup-canetas-signature/', title: 'Simulador de canetas Newpen Signature', preview: 'simulador-canetas.html' },
  };
  const attribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const requested = new URLSearchParams(location.search).get('ferramenta');
  if (tool && Object.hasOwn(tools, requested)) tool.value = requested;
  function updateCode() {
    const selected = tools[tool?.value] || tools.brindes;
    const editor = new URL(selected.url, window.location.href);
    code.value = `<iframe src="${attribute(editor.href)}" title="${selected.title}" width="100%" height="1100" style="border:0;max-width:100%" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>\n<p><a href="${attribute(editor.href)}" target="_blank" rel="noopener">Abrir simulador em tela inteira</a></p>`;
    const preview = document.querySelector('#embedPreviewLink');
    if (preview) preview.href = selected.preview;
    document.querySelector('#embedStatus').textContent = '';
  }
  tool?.addEventListener('change', updateCode);
  updateCode();
  document.querySelector('#copyEmbed').addEventListener('click', async () => {
    const status = document.querySelector('#embedStatus');
    try {
      await navigator.clipboard.writeText(code.value);
      status.textContent = 'Código copiado. Cole em um bloco HTML do seu blog.';
    } catch {
      code.focus();
      code.select();
      status.textContent = 'Selecionei o código. Use Ctrl+C ou a opção Copiar do seu dispositivo.';
    }
  });
}
