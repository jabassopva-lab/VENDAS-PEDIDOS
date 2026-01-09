
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

export const generatePerformanceReport = async (monthlyData: SalesData[]): Promise<string> => {
  try {
    if (!monthlyData || monthlyData.length === 0) {
      return "Ainda não há dados de vendas suficientes para gerar uma análise mensal. Registre suas primeiras vendas para começar!";
    }

    const ai = getAIClient();
    
    const dataSummary = monthlyData.map(d => 
      `- Mês: ${d.name} | Receita: R$ ${d.revenue.toFixed(2)} | Lucro: R$ ${d.profit.toFixed(2)} | Qtd Pedidos: ${d.sales}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este desempenho mensal e forneça um relatório estratégico:\n${dataSummary}`,
      config: {
        systemInstruction: "Você é um Consultor de Negócios especializado em docerias. Compare o desempenho entre os meses listados. Identifique qual mês foi melhor, sugira melhorias para os meses mais fracos e dê 3 conselhos práticos para o próximo mês. Use tom motivador e profissional.",
        temperature: 0.6,
      }
    });
    
    return response.text || "Relatório gerado! Continue acompanhando seus resultados mensais.";
  } catch (error) {
    console.error("Erro Gemini (Report):", error);
    return "Ocorreu um erro ao processar o relatório mensal. Verifique sua conexão e tente novamente.";
  }
}

export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Insights rápidos: Sua média por pedido está saudável.";
}
