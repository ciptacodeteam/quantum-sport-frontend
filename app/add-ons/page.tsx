'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MainHeader from '@/components/headers/MainHeader'
import Image from 'next/image'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import OpenScheduleModal from './openScheduleModal'
dayjs.locale('id')

export default function AddOnsPage() {
    const [activeTab, setActiveTab] = useState<'coach' | 'raket' | 'ballboy'>('coach')
    const [activeSubTab, setActiveSubTab] = useState<'guided' | 'coaching'>('guided')

    const [showModal, setShowModal] = useState(false)
    const [selectedCoach, setSelectedCoach] = useState<any>(null)
    const [selectedBallboy, setSelectedBallboy] = useState<any>(null)

    // 🏟 contoh data lapangan (nanti dari parent)
    const selectedCourts = [
        { id: 1, name: 'Court 1', date: '2025-11-07' },
        { id: 2, name: 'Court 2', date: '2025-11-09' },
    ]

    const mockSchedules = [
        { time: '08:00', available: true },
        { time: '09:00', available: false },
        { time: '10:00', available: true },
        { time: '11:00', available: true },
    ]

    // 👨‍🏫 Data Coach
    const coaches = [
        { id: 1, name: 'Coach Zeky', price: 250000, image: '', type: 'guided' },
        { id: 2, name: 'Coach Andi', price: 250000, image: '', type: 'guided' },
        { id: 3, name: 'Coach Fajar', price: 250000, image: '', type: 'guided' },
        { id: 4, name: 'Coach Riko', price: 250000, image: '', type: 'coaching' },
    ]

    // 🏸 Data Raket
    const [racketQty, setRacketQty] = useState(0)
    const totalRacket = 10
    const usedRacket = 4
    const availableRacket = totalRacket - usedRacket
    const racketPrice = 50000

    // 🧤 Data Ballboy
    const ballboys = [
        { id: 1, name: 'Ball Boy A', price: 100000, image: '' },
        { id: 2, name: 'Ball Boy B', price: 100000, image: '' },
    ]

    return (
        <>
            <MainHeader backHref="/" title={"Produk Tambahan"} withLogo={false} />

            <div className='w-11/12 mx-auto pt-28'>
                {/* Tabs utama */}
                <div className="flex gap-2 mb-4">
                    {['Coach', 'Raket', 'Ball boy'].map((item) => (
                        <Button
                            key={item}
                            variant={activeTab === item.toLowerCase().replace(' ', '') ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setActiveTab(item.toLowerCase().replace(' ', '') as any)}
                        >
                            {item}
                        </Button>
                    ))}
                </div>

                {/* Subtab Coach */}
                {activeTab === 'coach' && (
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant={activeSubTab === 'guided' ? 'default' : 'outline'}
                            onClick={() => setActiveSubTab('guided')}
                            className="flex-1"
                        >
                            Guided Match
                        </Button>
                        <Button
                            variant={activeSubTab === 'coaching' ? 'default' : 'outline'}
                            onClick={() => setActiveSubTab('coaching')}
                            className="flex-1"
                        >
                            Coaching
                        </Button>
                    </div>
                )}

                {/* COACH LIST */}
                {activeTab === 'coach' && (
                    <div className="flex flex-col gap-3 mb-4">
                        {coaches
                            .filter((coach) => coach.type === activeSubTab)
                            .map((coach) => (
                                <Card
                                    key={coach.id}
                                    onClick={() => {
                                        setSelectedCoach(coach)
                                        setSelectedBallboy(null) // reset ballboy
                                        setShowModal(true)
                                    }}
                                    className="cursor-pointer hover:border-primary transition"
                                >
                                    <div className='px-4 py-3'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex gap-4'>
                                                <div className="rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                    <Image
                                                        src={coach.image && coach.image.trim() !== '' ? coach.image : '/assets/img/avatar.webp'}
                                                        alt={coach.name}
                                                        width={48}
                                                        height={48}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-semibold">{coach.name}</p>
                                                    <p className="text-xs text-muted-foreground">Pilih jadwal coach</p>
                                                </div>
                                            </div>
                                            <ChevronRight className='text-primary' />
                                        </div>

                                        <div className='flex py-2 px-4 bg-muted rounded-sm mt-4'>
                                            <p className="text-foreground">
                                                <span className='font-semibold text-primary'>
                                                    Rp{coach.price.toLocaleString('id-ID')}{' '}
                                                </span>
                                                <span className="text-muted-foreground text-sm">/sesi</span>
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>
                )}

                {/* RAKET */}
                {activeTab === 'raket' && (
                    <div className="flex flex-col gap-3 mb-4">
                        <Card>
                            <div className='px-4 py-3'>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">Sewa Raket</p>
                                        <p className="text-xs text-muted-foreground">
                                            Tersedia {availableRacket} raket
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setRacketQty((prev) => Math.max(prev - 1, 0))}
                                            disabled={racketQty <= 0}
                                        >
                                            <Minus size={16} />
                                        </Button>
                                        <span className="font-semibold w-6 text-center">{racketQty}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setRacketQty((prev) => Math.min(prev + 1, availableRacket))}
                                            disabled={racketQty >= availableRacket}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>

                                <div className='flex py-2 px-4 bg-muted rounded-sm mt-4'>
                                    <p className="text-foreground">
                                        <span className='font-semibold text-primary'>
                                            Rp{racketPrice.toLocaleString('id-ID')}{' '}
                                        </span>
                                        <span className="text-muted-foreground text-sm">/raket</span>
                                    </p>
                                </div>

                                {racketQty > 0 && (
                                    <p className="mt-2 text-sm text-primary font-medium">
                                        Total: Rp{(racketQty * racketPrice).toLocaleString('id-ID')}
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* BALLBOY */}
                {activeTab === 'ballboy' && (
                    <div className="flex flex-col gap-3 mb-4">
                        {ballboys.map((b) => (
                            <Card
                                key={b.id}
                                onClick={() => {
                                    setSelectedBallboy(b)
                                    setSelectedCoach(null) // reset coach
                                    setShowModal(true)
                                }}
                                className="cursor-pointer hover:border-primary transition"
                            >
                                <div className='px-4 py-3'>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex gap-4'>
                                            <div className="rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                <Image
                                                    src={b.image && b.image.trim() !== '' ? b.image : '/assets/img/avatar.webp'}
                                                    alt={b.name}
                                                    width={48}
                                                    height={48}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="font-semibold">{b.name}</p>
                                                <p className="text-xs text-muted-foreground">Pilih jadwal ball boy</p>
                                            </div>
                                        </div>
                                        <ChevronRight className='text-primary' />
                                    </div>

                                    <div className='flex py-2 px-4 bg-muted rounded-sm mt-4'>
                                        <p className="text-foreground">
                                            <span className='font-semibold text-primary'>
                                                Rp{b.price.toLocaleString('id-ID')}{' '}
                                            </span>
                                            <span className="text-muted-foreground text-sm">/sesi</span>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL JADWAL */}
            <OpenScheduleModal
                open={showModal}
                onOpenChange={setShowModal}
                title={
                    selectedCoach
                        ? `Pilih Jadwal - ${selectedCoach.name}`
                        : selectedBallboy
                            ? `Pilih Jadwal - ${selectedBallboy.name}`
                            : 'Pilih Jadwal'
                }
                selectedCourts={selectedCourts}
                schedules={mockSchedules}
            />
        </>
    )
}
