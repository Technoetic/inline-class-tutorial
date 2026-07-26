const stableGauges = [
	{ id: "signal", label: "신호", value: "안정" },
	{ id: "route", label: "경로", value: "연결" },
	{ id: "response", label: "응답", value: "선명" },
];

const training = {
	id: "training-scanner",
	kind: "tutorial",
	title: "조작 훈련 · 끊어진 스캐너",
	objective: "빛나는 탐지 능력을 주 선체로 옮겨 보세요.",
	core: {
		name: "아틀라스 주 선체",
		subtitle: "구조 작전의 중심",
		abilities: [
			{ id: "core-power", label: "동력", icon: "power", slotId: "power-slot" },
		],
	},
	donor: {
		name: "잔향 캡슐",
		subtitle: "훈련용 보조 선체",
		abilities: [
			{ id: "training-scan", label: "탐지", icon: "scan", slotId: "scan-slot" },
		],
	},
	requiredSlots: [{ id: "scan-slot", label: "탐지 슬롯", icon: "scan" }],
	connections: [],
	baselineGauges: stableGauges,
	futureMission: null,
	correctDecision: "inline",
	rationaleClueId: null,
	rationaleClues: [],
	recovery: {
		transfer: "탐지 능력을 선택하면 준비된 주 선체 슬롯으로 이동해요.",
	},
	why: {
		transfer:
			"능력은 선체가 할 수 있는 일을 뜻해요. 지금은 탐지 하나를 옮기는 연습이에요.",
	},
	resultReason:
		"능력의 원래 자리와 새 자리가 숫자와 아이콘으로 함께 바뀌었어요.",
};

const main = [
	{
		id: "echo-relay",
		kind: "inline",
		title: "미션 1 · 메아리 중계 캡슐",
		objective: "주 선체의 말만 전달하는 작은 캡슐을 조사하세요.",
		core: {
			name: "아틀라스 주 선체",
			subtitle: "통신 작전의 중심",
			abilities: [
				{
					id: "core-power",
					label: "동력",
					icon: "power",
					slotId: "power-slot",
				},
				{
					id: "core-route",
					label: "항로",
					icon: "route",
					slotId: "route-slot",
				},
			],
		},
		donor: {
			name: "메아리 캡슐",
			subtitle: "주 선체의 응답을 전달함",
			abilities: [
				{
					id: "echo-response",
					label: "응답 전달",
					icon: "signal",
					slotId: "response-slot",
				},
			],
		},
		requiredSlots: [
			{ id: "response-slot", label: "응답 슬롯", icon: "signal" },
		],
		connections: [
			{
				id: "tower-call",
				label: "관제탑 호출",
				source: "관제탑",
				target: "donor",
			},
		],
		baselineGauges: stableGauges,
		futureMission: null,
		correctDecision: "inline",
		rationaleClueId: null,
		rationaleClues: [],
		recovery: {
			inspect: "현재 능력과 미래 임무를 함께 살펴보세요.",
			prepare: "연결을 돌리기 전에 받을 슬롯이 필요해요.",
			reconnect: "관제탑의 호출선을 준비한 응답 슬롯으로 돌리세요.",
			transfer: "연결이 안전해졌어요. 이제 응답 전달 능력을 옮기세요.",
		},
		why: {
			inspect: "이 캡슐은 주 선체의 응답을 전달할 뿐, 혼자 맡은 임무가 없어요.",
			baseline: "작업 전 신호를 기록하면 바뀐 뒤에도 같은지 비교할 수 있어요.",
			prepare:
				"받을 자리를 먼저 만들면 연결을 끊지 않고 안전하게 돌릴 수 있어요.",
			reconnect: "외부 호출이 먼저 주 선체를 향하면 캡슐을 비울 준비가 돼요.",
			checkpoint: "연결만 바꾼 지금도 신호가 같은지 확인해요.",
			transfer: "이제 캡슐의 마지막 능력을 주 선체가 직접 맡아요.",
			verify: "처음 기록한 세 계기와 지금 계기가 모두 같아야 해요.",
			recycle: "능력과 연결이 모두 0인 빈 껍데기만 회수할 수 있어요.",
		},
		resultReason:
			"독립 임무가 없던 캡슐의 능력과 연결을 옮겨도 세 계기의 결과가 같았어요.",
	},
	{
		id: "life-garden",
		kind: "keep",
		title: "미션 2 · 생명 유지 정원",
		objective: "작아 보이는 정원 캡슐을 합쳐도 되는지 판별하세요.",
		core: {
			name: "아틀라스 주 선체",
			subtitle: "항해와 관제를 담당",
			abilities: [
				{
					id: "core-route",
					label: "항로",
					icon: "route",
					slotId: "route-slot",
				},
			],
		},
		donor: {
			name: "생명 유지 정원",
			subtitle: "작지만 스스로 생명을 돌봄",
			abilities: [
				{
					id: "garden-air",
					label: "산소 순환",
					icon: "air",
					slotId: "air-slot",
				},
				{
					id: "garden-seed",
					label: "종자 보존",
					icon: "seed",
					slotId: "seed-slot",
				},
			],
		},
		requiredSlots: [],
		connections: [
			{
				id: "air-monitor",
				label: "산소 관측",
				source: "의무실",
				target: "donor",
			},
		],
		baselineGauges: stableGauges,
		futureMission: "다음 항해에서 독립 생태 실험 예정",
		correctDecision: "keep",
		rationaleClueId: "future-ecosystem",
		rationaleClues: [
			{ id: "small-size", label: "캡슐이 작다", correct: false },
			{ id: "future-ecosystem", label: "독립 생태 임무가 있다", correct: true },
			{ id: "one-connection", label: "연결선이 하나다", correct: false },
		],
		recovery: {
			inspect: "크기보다 스스로 맡은 일과 미래 임무를 보세요.",
			rationale: "합치지 않아야 하는 가장 중요한 단서를 고르세요.",
		},
		why: {
			inspect:
				"작은 크기나 적은 연결은 합칠 근거가 아니에요. 독립 책임을 먼저 봐야 해요.",
			rationale:
				"앞으로 혼자 수행할 임무가 있다면 지금 능력이 적어도 분리해 둬야 해요.",
		},
		resultReason:
			"산소·종자 책임과 미래 생태 임무가 남아 있어 두 선체를 분리해 지켰어요.",
	},
	{
		id: "navigation-shadow",
		kind: "keep",
		title: "미션 3 · 항법 그림자",
		objective: "주 선체와 닮은 표시 능력 뒤의 미래 임무를 찾아내세요.",
		core: {
			name: "아틀라스 주 선체",
			subtitle: "현재 항로를 계산함",
			abilities: [
				{
					id: "core-route",
					label: "항로 계산",
					icon: "route",
					slotId: "route-slot",
				},
				{
					id: "core-display",
					label: "항로 표시",
					icon: "display",
					slotId: "display-slot",
				},
			],
		},
		donor: {
			name: "그림자 탐사 캡슐",
			subtitle: "멀리 떠날 준비 중",
			abilities: [
				{
					id: "deep-scan",
					label: "심우주 탐지",
					icon: "scan",
					slotId: "deep-scan-slot",
				},
			],
		},
		requiredSlots: [],
		connections: [
			{
				id: "probe-link",
				label: "탐사대 연결",
				source: "탐사대",
				target: "donor",
			},
		],
		baselineGauges: stableGauges,
		futureMission: "장거리 독립 탐사 출항 예정",
		correctDecision: "keep",
		rationaleClueId: "future-expedition",
		rationaleClues: [
			{ id: "similar-display", label: "표시 모양이 비슷하다", correct: false },
			{ id: "single-ability", label: "능력이 하나뿐이다", correct: false },
			{
				id: "future-expedition",
				label: "독립 탐사 출항이 예정됐다",
				correct: true,
			},
		],
		recovery: {
			inspect: "현재 닮은 점보다 앞으로 혼자 해야 할 일을 찾아보세요.",
			rationale: "이 캡슐이 계속 존재해야 하는 단서를 고르세요.",
		},
		why: {
			inspect:
				"현재 능력이 하나여도 곧 독립 임무를 맡는다면 빈 껍데기가 아니에요.",
			rationale:
				"미래 책임은 합치기 판단의 일부예요. 예정된 독립 탐사를 지켜야 해요.",
		},
		resultReason:
			"장거리 독립 탐사라는 미래 책임이 있어 그림자 캡슐을 그대로 유지했어요.",
	},
	{
		id: "orbit-relay",
		kind: "inline",
		title: "미션 4 · 궤도 관제 릴레이",
		objective: "힌트 없이 세 능력과 두 연결을 안전한 순서로 흡수하세요.",
		core: {
			name: "아틀라스 주 선체",
			subtitle: "최종 관제 중심",
			abilities: [
				{
					id: "core-power",
					label: "동력",
					icon: "power",
					slotId: "power-slot",
				},
				{
					id: "core-route",
					label: "항로",
					icon: "route",
					slotId: "route-slot",
				},
			],
		},
		donor: {
			name: "궤도 관제 릴레이",
			subtitle: "주 선체 명령을 얇게 전달함",
			abilities: [
				{
					id: "relay-coordinate",
					label: "좌표 전달",
					icon: "route",
					slotId: "coordinate-slot",
				},
				{
					id: "relay-signal",
					label: "신호 전달",
					icon: "signal",
					slotId: "signal-slot",
				},
				{
					id: "relay-confirm",
					label: "응답 확인",
					icon: "pulse",
					slotId: "confirm-slot",
				},
			],
		},
		requiredSlots: [
			{ id: "coordinate-slot", label: "좌표 슬롯", icon: "route" },
			{ id: "signal-slot", label: "신호 슬롯", icon: "signal" },
			{ id: "confirm-slot", label: "응답 슬롯", icon: "pulse" },
		],
		connections: [
			{
				id: "station-link",
				label: "정거장 연결",
				source: "궤도 정거장",
				target: "donor",
			},
			{
				id: "crew-link",
				label: "구조대 연결",
				source: "구조대",
				target: "donor",
			},
		],
		baselineGauges: stableGauges,
		futureMission: null,
		correctDecision: "inline",
		rationaleClueId: null,
		rationaleClues: [],
		recovery: {
			inspect: "능력 수보다 그 능력이 누구의 일을 전달하는지 살펴보세요.",
			prepare: "세 능력을 받을 슬롯을 모두 준비하세요.",
			reconnect: "두 외부 연결이 모두 주 선체를 향해야 해요.",
			transfer: "캡슐이 빌 때까지 세 능력을 차례로 옮기세요.",
		},
		why: {
			inspect: "세 능력 모두 주 선체 관제를 전달할 뿐 독립 임무는 없어요.",
			baseline: "먼저 계기를 기록해야 마지막에 결과가 같은지 알 수 있어요.",
			prepare:
				"모든 능력의 받을 자리를 먼저 준비하면 연결을 안전하게 바꿀 수 있어요.",
			reconnect:
				"외부 연결을 주 선체로 돌려도 신호가 유지되는지 곧 확인할 거예요.",
			checkpoint: "책임을 옮기기 전에 연결 전환만으로 문제가 없는지 확인해요.",
			transfer: "이제 릴레이가 대신하던 관제 능력을 주 선체가 직접 맡아요.",
			verify: "마지막 계기가 처음 기록과 같아야 빈 껍데기를 회수할 수 있어요.",
			recycle:
				"능력 0, 연결 0이 된 릴레이는 더 이상 따로 존재할 이유가 없어요.",
		},
		resultReason:
			"관제 능력과 연결을 작은 단계로 옮긴 뒤에도 세 계기가 모두 같았어요.",
	},
];

const finalChallenge = {
	id: "final-transfer",
	title: "마지막 판별 · 하나가 된 두 선체",
	objective: "흡수해도 안전한 한 쌍을 고르세요.",
	choices: [
		{
			id: "relay-shell",
			title: "신호 코어 + 빈 중계 껍데기",
			summary: "중계 능력 하나, 독립 임무 없음",
			correct: true,
			feedback:
				"맞아요. 중계 껍데기는 코어의 일만 대신하고 미래 임무가 없어요.",
		},
		{
			id: "seed-vault",
			title: "항해선 + 종자 보존고",
			summary: "종자 보존 책임과 다음 행성 임무",
			correct: false,
			feedback: "종자 보존고에는 독립 책임과 미래 임무가 남아 있어요.",
		},
		{
			id: "rescue-drone",
			title: "관제선 + 구조 드론",
			summary: "수색과 견인이라는 두 독립 능력",
			correct: false,
			feedback: "구조 드론은 스스로 수색하고 견인하므로 빈 껍데기가 아니에요.",
		},
	],
};

export const missionContent = { training, main, finalChallenge };
