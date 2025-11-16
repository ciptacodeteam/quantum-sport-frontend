import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { Crown, Calendar, Clock, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MembershipUser } from '@/types/model';

export default function MembershipDetailsCard({
  membershipUser
}: {
  membershipUser: MembershipUser;
}) {
  const membership = membershipUser?.membership;
  if (!membership) return null;

  const isExpired = membershipUser.isExpired;
  const isSuspended = membershipUser.isSuspended;

  // Safe numeric values with NaN handling
  const totalSessions =
    typeof membership.sessions === 'number' && !isNaN(membership.sessions)
      ? membership.sessions
      : 0;
  const remainingSessions =
    typeof membershipUser.remainingSessions === 'number' && !isNaN(membershipUser.remainingSessions)
      ? membershipUser.remainingSessions
      : 0;
  const duration =
    typeof membership.duration === 'number' && !isNaN(membership.duration)
      ? membership.duration
      : 0;
  const daysRemaining =
    typeof membershipUser.remainingDuration === 'number' && !isNaN(membershipUser.remainingDuration)
      ? membershipUser.remainingDuration
      : 0;

  const sessionsUsed = Math.max(0, totalSessions - remainingSessions);
  const progressPercentage =
    totalSessions > 0 ? Math.min(100, Math.max(0, (sessionsUsed / totalSessions) * 100)) : 0;

  return (
    <Card className="mb-6 border-amber-200 bg-linear-to-br from-amber-50 to-white">
      <CardHeader className="border-b border-amber-100">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-600" />
          <span className="text-amber-900">Detail Membership</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Membership Name & Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-2xl font-bold text-amber-900">{membership.name}</h3>
            {membership.description && (
              <p className="text-sm text-gray-700">{membership.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {isSuspended ? (
              <Badge className="border-red-200 bg-red-100 text-red-800">
                <AlertCircle className="mr-1 h-3 w-3" />
                Ditangguhkan
              </Badge>
            ) : isExpired ? (
              <Badge className="border-gray-200 bg-gray-100 text-gray-800">
                <AlertCircle className="mr-1 h-3 w-3" />
                Kadaluarsa
              </Badge>
            ) : (
              <Badge className="border-green-200 bg-green-100 text-green-800">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Aktif
              </Badge>
            )}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Total Sessions */}
          <div className="rounded-lg border border-amber-200 bg-white p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              Total Sesi
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {totalSessions} <span className="text-base font-normal">sesi</span>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-lg border border-amber-200 bg-white p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Durasi
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {duration} <span className="text-base font-normal">hari</span>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Masa Berlaku
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Mulai</div>
              <div className="font-semibold text-gray-900">
                {dayjs(membershipUser.startDate).format('DD MMM YYYY')}
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div>
              <div className="text-sm text-gray-600">Berakhir</div>
              <div className="font-semibold text-gray-900">
                {membershipUser.endDate ? dayjs(membershipUser.endDate).format('DD MMM YYYY') : '-'}
              </div>
            </div>
          </div>
          {!isExpired && !isSuspended && daysRemaining > 0 && (
            <div className="mt-3 text-center text-sm text-amber-700">
              {daysRemaining} hari tersisa
            </div>
          )}
        </div>

        {/* Session Usage Progress */}
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <TrendingUp className="h-4 w-4" />
              Progress Pemakaian Sesi
            </div>
            <span className="text-sm font-semibold text-amber-900">
              {sessionsUsed}/{totalSessions} sesi
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Sisa sesi: {remainingSessions}</span>
            <span className="font-medium text-amber-700">
              {isNaN(progressPercentage) ? 0 : progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Membership Benefits */}
        {membership.benefits && membership.benefits.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-white p-4">
            <div className="mb-3 text-sm font-medium text-gray-700">Benefit Membership</div>
            <ul className="space-y-2">
              {membership.benefits.map((benefit) => (
                <li key={benefit.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-gray-700">{benefit.benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suspension Info */}
        {isSuspended && membershipUser.suspensionReason && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-900">
              <AlertCircle className="h-4 w-4" />
              Informasi Penangguhan
            </div>
            <p className="mb-2 text-sm text-red-800">{membershipUser.suspensionReason}</p>
            {membershipUser.suspensionEndDate && (
              <p className="text-xs text-red-700">
                Berakhir: {dayjs(membershipUser.suspensionEndDate).format('DD MMM YYYY')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
