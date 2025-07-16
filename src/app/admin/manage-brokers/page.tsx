
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getBrokers,
  deleteBroker,
  updateBrokerOrder,
} from "../actions";
import type { Broker } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BrokerFormDialog } from "@/components/admin/BrokerFormDialog";
import { Badge } from "@/components/ui/badge";

function SortableBrokerRow({ broker, onSuccess }: { broker: Broker, onSuccess: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: broker.id });
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const handleDelete = async () => {
      const result = await deleteBroker(broker.id);
      if (result.success) {
        toast({ title: 'Success', description: 'Broker deleted.'})
        onSuccess();
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message})
      }
  }

  // Safely access broker name and risk level for both old and new data structures
  const brokerName = broker.basicInfo?.broker_name || broker.name;
  const riskLevel = broker.regulation?.risk_level;
  const wikifxScore = broker.reputation?.wikifx_score;


  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="w-10">
        <div {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <Image
          src={broker.logoUrl}
          alt={`${brokerName} logo`}
          width={32}
          height={32}
          className="rounded-md border p-0.5 bg-white"
          data-ai-hint="logo"
        />
      </TableCell>
      <TableCell className="font-medium">{brokerName}</TableCell>
      <TableCell>
        {riskLevel ? <Badge variant="outline" className="capitalize">{riskLevel}</Badge> : 'N/A'}
      </TableCell>
      <TableCell className="flex items-center gap-1">
          {wikifxScore ?? 'N/A'} <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </TableCell>
      <TableCell className="space-x-2 text-right">
        <BrokerFormDialog
          broker={broker}
          onSuccess={onSuccess}
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
        >
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setIsFormOpen(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </BrokerFormDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                broker.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function ManageBrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchBrokers = async () => {
    // No need to set loading true here if we want a silent refetch
    try {
      const data = await getBrokers();
      setBrokers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch brokers.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []); 

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = brokers.findIndex((b) => b.id === active.id);
      const newIndex = brokers.findIndex((b) => b.id === over!.id);
      const newOrderBrokers = arrayMove(brokers, oldIndex, newIndex);
      setBrokers(newOrderBrokers);

      // Update order in Firestore
      const orderedIds = newOrderBrokers.map((b) => b.id);
      const result = await updateBrokerOrder(orderedIds);
      if (result.success) {
        toast({ title: "Success", description: "Broker order updated." });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
        // Revert optimistic update
        fetchBrokers();
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Manage Brokers"
          description="Add, edit, or remove partner brokers."
        />
        <BrokerFormDialog
          onSuccess={fetchBrokers}
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Broker
          </Button>
        </BrokerFormDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>WikiFX Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={brokers}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {brokers.map((broker) => (
                      <SortableBrokerRow key={broker.id} broker={broker} onSuccess={fetchBrokers} />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
