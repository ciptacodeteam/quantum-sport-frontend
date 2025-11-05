import MainHeader from "@/components/headers/MainHeader";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const valuePacks = [
    {
        id: 1,
        name: "Quantum Premium",
        price: 30000000,
        features: [
            "Akses penuh ke semua fitur premium",
            "Dukungan prioritas dari tim Quantum",
            "Pembaruan otomatis dan fitur eksklusif",
            "Cocok untuk pengguna profesional dan tim",
        ],
    },
    {
        id: 2,
        name: "Quantum Standard",
        price: 15000000,
        features: [
            "Fitur utama untuk kebutuhan dasar",
            "Akses terbatas ke dukungan prioritas",
            "Cocok untuk pengguna individu",
        ],
    },

    {
        id: 3,
        name: "Quantum Standard",
        price: 15000000,
        features: [
            "Fitur utama untuk kebutuhan dasar",
            "Akses terbatas ke dukungan prioritas",
            "Cocok untuk pengguna individu",
        ],
    },
];

const ValuePackPage = () => {
    return (
        <>
            <MainHeader backHref="/" title={"Value Pack"} withLogo={false} />

            <main className="flex flex-col gap-4 mt-28 mx-auto w-11/12 pb-12">
                {valuePacks.map((pack) => (
                    <Card key={pack.id} className="shadow-xs">
                        <CardHeader>
                            <CardTitle className={`uppercase font-semibold`}>
                                {pack.name}
                            </CardTitle>
                            <CardDescription>
                                <div className="mb-2">
                                    <span className="text-xl font-bold text-primary">
                                        Rp{pack.price.toLocaleString("id-ID")}
                                    </span>
                                </div>
                                <ul className="list-disc list-outside pl-4 space-y-1 text-muted-foreground">
                                    {pack.features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full" size={"lg"}>
                                Pesan Sekarang
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </main>
        </>
    );
};

export default ValuePackPage;
