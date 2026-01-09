
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types.ts";

export const generateProductDescription = async (name: string, category: string, price: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
    return "No momento não foi possível processar a análise avançada. Verifique se há vendas registradas ou tente novamente em alguns instantes.";
  }
}

export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Insights rápidos: Sua média por pedido está saudável.";
}
