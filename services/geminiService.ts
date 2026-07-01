
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
    } else if (businessType === 'FASHION_APPAREL') {
      systemInstruction = "Você é um copywriter de elite para lojas de moda, roupas, vestuário e acessórios. Escreva descrições curtas (2-3 frases), estilosas, modernas, destacando caimento, conforto, elegância e tendências com emojis de moda.";
    } else if (businessType === 'FOOTWEAR') {
      systemInstruction = "Você é um copywriter de elite para lojas de calçados, tênis, sapatos e bolsas. Escreva descrições curtas (2-3 frases), dinâmicas, destacando conforto, durabilidade, design anatômico e estilo.";
    } else if (businessType === 'ELECTRONICS_TECH') {
      systemInstruction = "Você é um copywriter de elite para tecnologia, eletrônicos, informática e gadgets modernos. Escreva descrições curtas (2-3 frases), inovadoras, destacando especificações técnicas, utilidade prática, inovação e modernidade.";
    } else if (businessType === 'TOYS_GIFTS') {
      systemInstruction = "Você é um copywriter de elite para brinquedos, artigos de papelaria e presentes criativos. Escreva descrições curtas (2-3 frases), lúdicas, cativantes, despertando sentimentos de diversão, afeto, aprendizado e criatividade.";
    } else if (businessType === 'AUTO_PARTS') {
      systemInstruction = "Você é um copywriter de elite para peças automotivas, mecânica e acessórios de carros e motos. Escreva descrições curtas (2-3 frases), precisas, destacando segurança, compatibilidade mecânica, qualidade e durabilidade técnica.";
    } else if (businessType === 'PET_SHOP') {
      systemInstruction = "Você é um copywriter de elite para pet shops e agropecuárias. Escreva descrições curtas (2-3 frases), carinhosas, focando na saúde, nutrição, diversão e bem-estar dos animais de estimação.";
    } else if (businessType === 'CONSTRUCTION') {
      systemInstruction = "Você é um copywriter de elite para materiais de construção, ferramentas, reforma e decoração. Escreva descrições curtas (2-3 frases), práticas, destacando qualidade, resistência, facilidade de instalação e excelência de acabamento.";
    } else if (businessType === 'PHARMACY_WELLNESS') {
      systemInstruction = "Você é um copywriter de elite para farmácias, suplementos e artigos de bem-estar e saúde. Escreva descrições curtas (2-3 frases), confiáveis, focando no autocuidado, vitalidade, saúde e qualidade de vida.";
    } else if (businessType === 'JEWELRY_ACCESSORIES') {
      systemInstruction = "Você é um copywriter de elite para joalheria, semijoias, relógios e óculos de sol. Escreva descrições curtas (2-3 frases), refinadas, brilhantes, destacando luxo, sofisticação, detalhes artesanais e brilho pessoal.";
    } else if (businessType === 'CRAFTS_ART') {
      systemInstruction = "Você é um copywriter de elite para artesanato, linhas, costura e materiais de pintura. Escreva descrições curtas (2-3 frases), inspiradoras, focando na criatividade, beleza dos detalhes feitos à mão e qualidade dos insumos de criação.";
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
    } else if (businessType === 'FASHION_APPAREL') {
      systemInstruction = "Você é um Consultor de Negócios especializado em varejo e atacado de moda e vestuário. Analise faturamento e vendas, dê conselhos práticos sobre gerenciamento de coleção, liquidações sazonais para girar estoque de coleções antigas e 3 estratégias para aumentar o valor médio das vendas (cross-selling).";
    } else if (businessType === 'FOOTWEAR') {
      systemInstruction = "Você é um Consultor de Negócios especializado no mercado de calçados e acessórios. Analise as vendas, sugira formas de otimizar a variedade de tamanhos e modelos em estoque, e forneça 3 conselhos práticos para fidelizar clientes.";
    } else if (businessType === 'ELECTRONICS_TECH') {
      systemInstruction = "Você é um Consultor de Negócios especialista no varejo de tecnologia e eletrônicos. Avalie o faturamento, recomende estratégias de garantias estendidas, acessórios de alta margem de lucro, e forneça 3 conselhos táticos para se diferenciar no preço e suporte técnico.";
    } else if (businessType === 'TOYS_GIFTS') {
      systemInstruction = "Você é um Consultor de Negócios especializado em brinquedos, presentes e papelaria. Analise o faturamento, forneça ideias para capitalizar em datas comemorativas cruciais (Dia das Crianças, Natal, Volta às Aulas) e recomende 3 práticas de vitrine e kits combinados.";
    } else if (businessType === 'AUTO_PARTS') {
      systemInstruction = "Você é um Consultor de Negócios especializado no setor automotivo e autopeças. Analise o volume e receita, recomende estratégias de catálogo rápido, parcerias ativas com mecânicas e oficinas locais, e dê 3 conselhos práticos de gestão de estoque de peças de alta demanda.";
    } else if (businessType === 'PET_SHOP') {
      systemInstruction = "Você é um Consultor de Negócios especializado em pet shops e clínicas veterinárias. Analise as métricas de faturamento, dê dicas sobre programas de fidelidade, planos de assinatura de ração e banho/tosa recorrentes, e dê 3 conselhos para o próximo mês.";
    } else if (businessType === 'CONSTRUCTION') {
      systemInstruction = "Você é um Consultor de Negócios especializado em materiais de construção, reforma e ferragens. Analise os resultados comerciais, recomende estratégias de parcerias com profissionais de obras (pedreiros, eletricistas, pintores) e apresente 3 táticas para aumentar vendas de produtos de acabamento.";
    } else if (businessType === 'PHARMACY_WELLNESS') {
      systemInstruction = "Você é um Consultor de Negócios especializado no segmento de farmácias, suplementos e produtos naturais. Avalie o faturamento, traga estratégias para aumentar a recorrência de produtos de uso contínuo e dê 3 conselhos para alavancar a venda de cosméticos e suplementação.";
    } else if (businessType === 'JEWELRY_ACCESSORIES') {
      systemInstruction = "Você é um Consultor de Negócios especializado em joalheria, semijoias e acessórios de luxo. Analise as vendas, sugira estratégias de embalagens sofisticadas, certificações de qualidade, datas festivas de romance e ofereça 3 conselhos práticos para pós-venda.";
    } else if (businessType === 'CRAFTS_ART') {
      systemInstruction = "Você é um Consultor de Negócios especialista em lojas de artesanato e aviamentos. Analise as vendas, recomende táticas de demonstração prática e workshops integrados para impulsionar a venda de materiais especializados, e dê 3 conselhos práticos.";
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
