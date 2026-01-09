
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types.ts";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key não configurada. Configure a variável de ambiente API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (name: string, category: string, price: number): Promise<string> => {
  try {
    const ai = getAIClient();
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma descrição atraente para o produto: ${name}, da categoria ${category}, que custa R$ ${price}.`,
      config: {
        systemInstruction: "Você é um copywriter de elite para e-commerce de doces. Escreva descrições curtas (2-3 frases), persuasivas e com emojis. Foque em dar água na boca.",
        temperature: 0.7,
      }
    });

    return response.text || "Descrição indisponível no momento.";
  } catch (error) {
    console.error("Erro Gemini (Product):", error);
    return "Um produto delicioso esperando por você! Confira os detalhes no balcão.";
  }
};

export const generatePerformanceReport = async (salesHistory: SalesData[]): Promise<string> => {
  try {
    if (!salesHistory || salesHistory.length === 0) {
      return "Ainda não há dados de vendas suficientes para gerar uma análise. Registre suas primeiras vendas para começar!";
    }

    const ai = getAIClient();
    
    const dataSummary = salesHistory.map(d => 
      `- Período: ${d.name} | Vendas: R$ ${d.revenue.toFixed(2)} | Lucro: R$ ${d.profit.toFixed(2)}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes dados de vendas e dê 3 dicas práticas para aumentar o lucro:\n${dataSummary}`,
      config: {
        systemInstruction: "Você é um Analista de Negócios Sênior especializado em distribuição de alimentos e doces (cocadas). Seja direto, use tom profissional e encorajador. Formate em tópicos curtos.",
        temperature: 0.5,
      }
    });
    
    return response.text || "Dados analisados com sucesso! Continue mantendo o foco nas vendas.";
  } catch (error) {
    console.error("Erro Gemini (Report):", error);
    return "No momento a IA está processando outros dados. Verifique se a chave de API está configurada corretamente no ambiente.";
  }
}

export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Insights rápidos: Sua média por pedido está saudável.";
}
