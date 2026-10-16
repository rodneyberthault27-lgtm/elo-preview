const code = document.querySelector('#embedCode');
if (code) {
  const editor = new URL('../index.html?embed=1', window.location.href);
  const attribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  code.value = `<iframe src="${attribute(editor.href)}" title="Simulador de brindes Elo Preview" width="100%" height="1100" style="border:0;max-width:100%" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>\n<p><a href="${attribute(editor.href)}" target="_blank" rel="noopener">Abrir simulador em tela inteira</a></p>`;
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
