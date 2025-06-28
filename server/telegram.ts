import { storage } from "./storage";

export interface DailySummary {
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  checkRevenue: number;
  totalTransactions: number;
  date: string;
}

export async function sendTelegramMessage(chatId: string, botToken: string, message: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Erreur Telegram API:', result);
      return false;
    }

    return result.ok;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Telegram:', error);
    return false;
  }
}

export async function getDailySummary(userId: number): Promise<DailySummary> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Récupérer toutes les transactions du jour pour cet utilisateur
  const allTransactions = await storage.getTransactions(userId);
  const todayTransactions = allTransactions.filter(transaction => {
    if (!transaction.createdAt) return false;
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= startOfDay && transactionDate < endOfDay;
  });

  let totalRevenue = 0;
  let cashRevenue = 0;
  let cardRevenue = 0;
  let checkRevenue = 0;

  todayTransactions.forEach(transaction => {
    const amount = parseFloat(transaction.total.toString());
    totalRevenue += amount;

    switch (transaction.paymentMethod) {
      case 'cash':
        cashRevenue += amount;
        break;
      case 'card':
        cardRevenue += amount;
        break;
      case 'check':
        checkRevenue += amount;
        break;
    }
  });

  return {
    totalRevenue,
    cashRevenue,
    cardRevenue,
    checkRevenue,
    totalTransactions: todayTransactions.length,
    date: today.toLocaleDateString('fr-FR'),
  };
}

export function formatDailySummaryMessage(summary: DailySummary, userName: string): string {
  return `
🏪 <b>FLOUZ - Clôture de Caisse</b>

👤 <b>Utilisateur:</b> ${userName}
📅 <b>Date:</b> ${summary.date}

💰 <b>CHIFFRE D'AFFAIRES JOURNALIER</b>
• <b>Total:</b> ${summary.totalRevenue.toFixed(2)} €
• <b>Espèces:</b> ${summary.cashRevenue.toFixed(2)} €
• <b>Carte bancaire:</b> ${summary.cardRevenue.toFixed(2)} €
• <b>Chèques:</b> ${summary.checkRevenue.toFixed(2)} €

📊 <b>STATISTIQUES</b>
• <b>Nombre de transactions:</b> ${summary.totalTransactions}
• <b>Ticket moyen:</b> ${summary.totalTransactions > 0 ? (summary.totalRevenue / summary.totalTransactions).toFixed(2) : '0.00'} €

---
<i>Rapport généré automatiquement par FLOUZ</i>
  `.trim();
}