'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportBulkDataApi } from '@/api/admin/analytics';
import { IconFileExcel } from '@tabler/icons-react';

interface ExportButtonsProps {
  startDate?: string;
  endDate?: string;
}

export default function ExportButtons({ startDate, endDate }: ExportButtonsProps) {
  const [exportingCourts, setExportingCourts] = useState(false);
  const [exportingInventory, setExportingInventory] = useState(false);
  const [exportingCoachBookings, setExportingCoachBookings] = useState(false);

  const handleExport = async (type: 'courts' | 'inventory' | 'coach-bookings') => {
    const setLoading = {
      courts: setExportingCourts,
      inventory: setExportingInventory,
      'coach-bookings': setExportingCoachBookings
    }[type];

    try {
      setLoading(true);

      const params: any = {};
      if (type === 'coach-bookings' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const blob = await exportBulkDataApi(type, params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on type
      const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Export Successful', {
        description: `${type} data has been exported successfully.`
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export Failed', {
        description: 'Failed to export data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data to Excel</CardTitle>
        <CardDescription>
          Download your business data in Excel format for offline analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('courts')}
            disabled={exportingCourts}
            className="justify-start"
          >
            <IconFileExcel className="mr-2 h-4 w-4" />
            {exportingCourts ? 'Exporting…' : 'Export Courts'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('inventory')}
            disabled={exportingInventory}
            className="justify-start"
          >
            <IconFileExcel className="mr-2 h-4 w-4" />
            {exportingInventory ? 'Exporting…' : 'Export Inventory'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('coach-bookings')}
            disabled={exportingCoachBookings}
            className="justify-start"
          >
            <IconFileExcel className="mr-2 h-4 w-4" />
            {exportingCoachBookings ? 'Exporting…' : 'Export Coach Bookings'}
          </Button>
        </div>

        {startDate && endDate && (
          <p className="text-muted-foreground mt-3 text-xs">
            Coach bookings export will use the selected date range:{' '}
            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
