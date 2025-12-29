import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DerivedTask, Task } from '@/types';
import TaskForm from '@/components/TaskForm';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';

interface Props {
  tasks: DerivedTask[];
  onAdd: (payload: Omit<Task, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export default function TaskTable({ tasks, onAdd, onUpdate, onDelete }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [details, setDetails] = useState<Task | null>(null);

  const existingTitles = useMemo(() => tasks.map(t => t.title), [tasks]);

  // ✅ Stable sorting
  const priorityRank = { High: 3, Medium: 2, Low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const roiDiff = (b.roi ?? 0) - (a.roi ?? 0);
    if (roiDiff !== 0) return roiDiff;

    const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return a.title.localeCompare(b.title);
  });

  // ✅ Safe ROI calculation
  const calculateROI = (revenue: number, time: number): string => {
    if (!revenue || !time || time <= 0) return '—';
    return (revenue / time).toFixed(2);
  };

  const handleAddClick = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEditClick = (task: Task) => {
    setEditing(task);
    setOpenForm(true);
  };

  const handleSubmit = (value: Omit<Task, 'id'> & { id?: string }) => {
    if (value.id) {
      const { id, ...rest } = value as Task;
      onUpdate(id, rest);
    } else {
      onAdd(value as Omit<Task, 'id'>);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>Tasks</Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={handleAddClick}>Add Task</Button>
        </Stack>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Time (h)</TableCell>
                <TableCell align="right">ROI</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTasks.map(t => (
                <TableRow key={t.id} hover onClick={() => setDetails(t)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{t.title}</Typography>
                      {t.notes && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          title={t.notes}
                          dangerouslySetInnerHTML={{ __html: t.notes as unknown as string }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">${t.revenue.toLocaleString()}</TableCell>
                  <TableCell align="right">{t.timeTaken}</TableCell>
                  <TableCell align="right">{calculateROI(t.revenue, t.timeTaken)}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleEditClick(t);
                          }}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            onDelete(t.id);
                          }}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box py={6} textAlign="center" color="text.secondary">No tasks yet. Click "Add Task" to get started.</Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      <TaskForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        existingTitles={existingTitles}
        initial={editing}
      />
      <TaskDetailsDialog
        open={!!details}
        task={details}
        onClose={() => setDetails(null)}
        onSave={onUpdate}
      />
    </Card>
  );
}
