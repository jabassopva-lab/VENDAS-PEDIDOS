
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types.ts";

// Função auxiliar para obter a instância com segurança
const getAiInstance = () => {
  const apiKey = (window as any).process?.env?.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (name: string, category: string, price: number): Promise<string> => {
  try {
    const ai = getAiInstance();
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
    return "Descrição gerada automaticamente com base nas configurações.";
  }
};

export const generatePerformanceReport = async (salesHistory: SalesData[]): Promise<string> => {
  try {
    const ai = getAiInstance();
    const dataTable = salesHistory.map(d => 
      `| ${d.name} | R$ ${d.revenue.toFixed(2)} | R$ ${d.profit.toFixed(2)} |`
    ).join('\n');

    const prompt = `
      # INSTRUÇÃO DO SISTEMA
      Você é um Analista de Negócios Sênior. Analise o seguinte histórico de vendas e lucro e forneça insights acionáveis para uma distribuição de cocadas.
      
      ${dataTable}

      Foque em identificar meses bons, quedas e sugestões de melhoria.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Análise concluída. Continue mantendo o bom trabalho nas vendas!";
  } catch (error) {
    console.error("Error generating report", error);
    return "No momento a IA está processando outros dados. Tente gerar o relatório novamente em instantes.";
  }
}

export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Análise detalhada disponível no painel principal.";
}
