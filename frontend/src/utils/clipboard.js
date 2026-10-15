// frontend/src/utils/clipboard.js

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback
    }
  }

  // Spolehlivý fallback pro HTTP i HTTPS hostingy
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Kopírování selhalo:', err);
    return false;
  }
}

export function getInviteUrl(code) {
  // Pokud běžíme na map.samfuksa.eu nebo lokálně, dynamicky použijeme aktuální doménu
  const origin = window.location.origin.includes('localhost') 
    ? window.location.origin 
    : (window.location.origin || 'https://map.samfuksa.eu');
  
  return `${origin}/?code=${encodeURIComponent(code)}`;
}
