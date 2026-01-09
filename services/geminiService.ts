
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a creative sales description for a product based on its name and category.
 */
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

    // Using gemini-3-flash-preview for text generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the .text property directly
    return response.text || "Descrição indisponível no momento.";
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Falha ao gerar descrição com IA.");
  }
};

/**
 * Generates a full business performance report based on the provided sales history.
 */
export const generatePerformanceReport = async (salesHistory: SalesData[]): Promise<string> => {
  try {
    // Format data for the prompt
    const dataTable = salesHistory.map(d => 
      `| ${d.name} | R$ ${d.revenue.toFixed(2)} | R$ ${d.profit.toFixed(2)} |`
    ).join('\n');

    const prompt = `
      # INSTRUÇÃO DO SISTEMA (Papel do Modelo)
      Você é um Analista de Negócios Sênior, focado em vendas e lucratividade. Sua tarefa é analisar o desempenho mensal fornecido, identificar tendências e fornecer insights acionáveis de forma concisa e profissional.

      # DADOS DE ENTRADA (Histórico de Vendas Mensais)
      Analise o seguinte histórico de vendas (Venda, Lucro):
      | Mês | Venda Total (R$) | Lucro Estimado (R$) |
      | :--- | :--- | :--- |
      ${dataTable}

      # REQUISITOS DE ANÁLISE
      Com base nos dados fornecidos:
      1.  **Melhor e Pior Performance:** Identifique qual foi o mês com **maior Lucro** e qual foi o mês com **menor Lucro**.
      2.  **Anomalia de Dezembro:** Identifique a **anomalia** de Dezembro (queda acentuada). Calcule o percentual de queda da Venda Total de Novembro para Dezembro e proponha **duas causas prováveis** para essa discrepância.
      3.  **Métrica de Eficiência:** Calcule a **Margem de Lucro Bruta** (Lucro / Venda) para o mês de Novembro e comente o resultado.
      4.  **Sugestão Acionável:** Sugira uma meta de Venda Total e Lucro para o próximo mês (Janeiro), assumindo uma recuperação de 80% da média de Setembro a Novembro.

      # FORMATO DA RESPOSTA
      Estruture a sua resposta em três seções claras: Resumo de Performance, Análise da Queda e Metas Sugeridas.
      Use formatação Markdown simples (negrito, listas). Não use tabelas Markdown na resposta, use texto corrido ou tópicos.
    `;

    // Using gemini-3-flash-preview for complex analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Access the .text property directly
    return response.text || "Não foi possível gerar o relatório.";
  } catch (error) {
    console.error("Error generating report", error);
    return "Erro ao analisar os dados de vendas.";
  }
}

/**
 * Legacy function for simple insights (kept for compatibility if needed, but report is preferred)
 */
export const getSalesInsights = async (totalRevenue: number, totalOrders: number): Promise<string> => {
    return "Análise detalhada disponível no painel principal.";
}
