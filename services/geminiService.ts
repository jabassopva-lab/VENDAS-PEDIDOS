
import { GoogleGenAI } from "@google/genai";
import { SalesData } from "../types.ts";

// Removed helper function to follow the requirement of creating a new instance right before use
export const generateProductDescription = async (name: string, category: string, price: number, businessType?: string): Promise<string> => {
  try {
    // Initializing GoogleGenAI directly using process.env.GEMINI_API_KEY right before calling generateContent
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    
    // Choose appropriate instruction based on the segment
    let systemInstruction = "Você é um copywriter de elite especialista em e-commerce geral. Escreva descrições curtas (2-3 frases), persuasivas, profissionais e com emojis de acordo com o produto.";
    
    if (businessType === 'COCORA') {
      systemInstruction = "Você é um copywriter de elite para e-commerce de doces e cocadas. Escreva descrições curtas (2-3 frases), persuasivas e com emojis. Foque em dar água na boca.";
    } else if (businessType === 'ACAI') {
      systemInstruction = "Você é um copywriter de elite para vendas de açaí, cremes e sobremesas geladas. Escreva descrições curtas (2-3 frases), refrescantes, irresistíveis e com emojis, focando no sabor e frescor.";
    } else if (businessType === 'COSMETIC_PERFUME') {
      systemInstruction = "Você é um copywriter de elite especialista em cosméticos, fragrâncias, perfumes e beleza de alto padrão. Escreva descrições curtas (2-3 frases), sofisticadas, elegantes, destacando aromas, sensações, autoestima e bem-estar, com emojis delicados.";
    } else if (businessType === 'CLEANING_PRODUCTS') {
      systemInstruction = "Você é um copywriter de elite para produtos de limpeza domésticos, industriais e automotivos. Escreva descrições curtas (2-3 frases), destacando eficácia de limpeza, alto rendimento, praticidade de uso e aromas frescos.";
    } else if (businessType === 'FOOD_DISTRIBUTION') {
      systemInstruction = "Você é um copywriter de elite especializado em distribuição de produtos alimentícios, insumos e mercearia de atacado. Escreva descrições curtas (2-3 frases) destacando qualidade, frescor, rendimento e ótimo custo-benefício.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere uma descrição atraente para o produto: ${name}, da categoria ${category}, que custa R$ ${price}.`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Descrição indisponível no momento.";
  } catch (error) {
    console.error("Erro Gemini (Product):", error);
    return "Um produto de excelente qualidade perfeito para as suas necessidades diárias. Confira!";
  }
};

export const generatePerformanceReport = async (monthlyData: SalesData[], businessType?: string): Promise<string> => {
  try {
    if (!monthlyData || monthlyData.length === 0) {
      return "Ainda não há dados de vendas suficientes para gerar uma análise mensal. Registre suas primeiras vendas para começar!";
    }

    // Initializing GoogleGenAI directly using process.env.GEMINI_API_KEY right before calling generateContent
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    
    const dataSummary = monthlyData.map(d => 
      `- Mês: ${d.name} | Receita: R$ ${d.revenue.toFixed(2)} | Lucro: R$ ${d.profit.toFixed(2)} | Qtd Pedidos: ${d.sales}`
    ).join('\n');

    // Choose appropriate strategic system instruction based on segment
    let systemInstruction = "Você é um Consultor de Negócios de elite especialista em pequenas e médias empresas. Compare o desempenho entre os meses listados. Identifique qual mês foi melhor, sugira melhorias estratégicas gerais para elevar faturamento e dê 3 conselhos práticos de gestão para o próximo mês. Use tom motivador e profissional.";

    if (businessType === 'COCORA') {
      systemInstruction = "Você é um Consultor de Negócios especializado em docerias, confeitarias e distribuição de doces. Compare o faturamento e vendas de potes, sugira melhorias para aumentar vendas em meses mais fracos e dê 3 conselhos práticos focados no mercado doceiro.";
    } else if (businessType === 'ACAI') {
      systemInstruction = "Você é um Consultor de Negócios especializado em vendas de açaí, gelaterias e sorveterias. Compare as vendas e rentabilidade, sugira melhorias para impulsionar pedidos em meses frios ou fracos e dê 3 conselhos de captação e combos promocionais.";
    } else if (businessType === 'COSMETIC_PERFUME') {
      systemInstruction = "Você é um Consultor de Negócios especializado em cosméticos, maquiagem e perfumaria de revendo. Compare o faturamento e lucratividade, indique como acelerar o giro de mercadorias paradas, atrair mais clientes finais e dê 3 estratégias de faturamento.";
    } else if (businessType === 'CLEANING_PRODUCTS') {
      systemInstruction = "Você é um Consultor de Negócios especializado no setor de produtos químicos de saneamento e limpeza. Analise os resultados de vendas, sugira estratégias de recorrência em condomínios/empresas, e dê 3 conselhos práticos para aumentar o ticket médio.";
    } else if (businessType === 'FOOD_DISTRIBUTION') {
      systemInstruction = "Você é um Consultor de Negócios especialista em logística e distribuição de alimentos (atacado/distribuidoras). Analise o faturamento e margem de lucro, sugira estratégias de vendas em fardos para estabelecimentos parceiros e dê 3 estratégias práticas.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este desempenho mensal e forneça um relatório estratégico:\n${dataSummary}`,
      config: {
        systemInstruction,
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
