
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, category: string, price: number): Promise<string> => {
  try {
    const prompt = `
      Atue como um especialista em marketing digital e copywriting.
      Escreva uma descrição de produto curta, persuasiva e atraente (máximo de 3 frases) para um item de e-commerce.
      
      Detalhes do produto:
      Nome: ${name}
      Categoria: ${category}
      Preço: R$ ${price}
      
      Use emojis com moderação. O tom deve ser profissional mas entusiasmado. Foque nos benefícios.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Descrição indisponível no momento.";
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Falha ao gerar descrição com IA.");
  }
};

export const generatePerformanceReport = async (salesHistory: SalesData[]): Promise<string> => {
  try {
    const dataTable = salesHistory.map(d => 
      `| ${d.name} | R$ ${d.revenue.toFixed(2)} | R$ ${d.profit.toFixed(2)} |`
    ).join('\n');

    const prompt = `
      # INSTRUÇÃO DO SISTEMA
      Você é um Analista de Negócios Sênior. Analise o seguinte histórico de vendas e lucro e forneça insights acionáveis.
      
      ${dataTable}

      Foque em identificar meses bons, quedas e sugestões de melhoria.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Não foi possível gerar o relatório.";
  } catch (error) {
    console.error("Error generating report", error);
    return "Erro ao analisar os dados de vendas.";
  }
}

export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Análise detalhada disponível no painel principal.";
}
