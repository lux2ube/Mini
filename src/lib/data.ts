export interface Broker {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    details: {
        minDeposit: string;
        leverage: string;
        spreads: string;
    };
    instructions: {
        description: string;
        linkText: string;
        link: string;
    };
}

export const brokers: Broker[] = [
    {
        id: "exness",
        name: "Exness",
        description: "A leading global broker known for its tight spreads, fast execution, and wide range of trading instruments.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$10",
            leverage: "1:Unlimited",
            spreads: "From 0.0 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open Exness Account",
            link: "https://www.exness.com"
        }
    },
    {
        id: "ic-markets",
        name: "IC Markets",
        description: "True ECN broker offering raw spreads and low latency. Ideal for scalpers and automated trading.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$200",
            leverage: "1:1000",
            spreads: "From 0.0 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open IC Markets Account",
            link: "https://www.icmarkets.com"
        }
    },
    {
        id: "pepperstone",
        name: "Pepperstone",
        description: "Award-winning broker with excellent customer service and multiple trading platforms.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$200",
            leverage: "1:500",
            spreads: "From 0.0 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open Pepperstone Account",
            link: "https://www.pepperstone.com"
        }
    },
    {
        id: "octafx",
        name: "OctaFX",
        description: "Offers a user-friendly platform with low minimum deposits, making it accessible for new traders.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$25",
            leverage: "1:500",
            spreads: "From 0.6 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open OctaFX Account",
            link: "https://www.octafx.com"
        }
    },
    {
        id: "xm",
        name: "XM",
        description: "A large, well-established broker with a strong emphasis on trader education.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$5",
            leverage: "1:1000",
            spreads: "From 0.6 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open XM Account",
            link: "https://www.xm.com"
        }
    },
    {
        id: "hfm",
        name: "HFM",
        description: "Formerly HotForex, a multi-asset broker providing a wide variety of account types and tools.",
        logoUrl: "https://placehold.co/100x100.png",
        details: {
            minDeposit: "$5",
            leverage: "1:2000",
            spreads: "From 0.1 pips"
        },
        instructions: {
            description: "To receive cashback, you must open an account using our partner link. If you have an existing account, you may need to open a new one under our IB.",
            linkText: "Open HFM Account",
            link: "https://www.hfm.com"
        }
    }
];
